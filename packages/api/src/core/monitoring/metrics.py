from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
import time
import psutil
import asyncio
from prometheus_client import Counter, Histogram, Gauge
from .logger import logger
import logging

logger = logging.getLogger(__name__)

@dataclass
class RequestMetrics:
    """요청 메트릭 데이터 클래스"""
    path: str
    method: str
    status_code: int
    response_time: float
    timestamp: datetime
    user_id: Optional[str] = None

class MetricsCollector:
    """메트릭 수집기"""
    
    def __init__(self):
        # 시스템 메트릭
        self.cpu_usage = Gauge('system_cpu_usage', 'CPU 사용률 (%)')
        self.memory_usage = Gauge('system_memory_usage', 'Memory 사용률 (%)')
        self.disk_usage = Gauge('system_disk_usage', 'Disk 사용률 (%)')
        
        # API 메트릭
        self.request_count = Counter('api_request_total', 'API 요청 총 횟수', 
                                   ['method', 'endpoint', 'status'])
        self.request_latency = Histogram('api_request_latency_seconds', 
                                       'API 요청 응답 시간', 
                                       ['method', 'endpoint'])
        
        # 에러 메트릭
        self.error_count = Counter('api_error_total', 'API 에러 총 횟수', 
                                 ['method', 'endpoint', 'error_type'])
        
        # 시스템 메트릭 수집 시작
        asyncio.create_task(self.collect_system_metrics())
        
    async def collect_system_metrics(self):
        """시스템 메트릭 수집"""
        while True:
            try:
                # CPU 사용률
                self.cpu_usage.set(psutil.cpu_percent())
                
                # 메모리 사용률
                memory = psutil.virtual_memory()
                self.memory_usage.set(memory.percent)
                
                # 디스크 사용률
                disk = psutil.disk_usage('/')
                self.disk_usage.set(disk.percent)
                
                await asyncio.sleep(15)  # 15초마다 수집
                
            except Exception as e:
                logger.error(f"시스템 메트릭 수집 중 오류 발생: {str(e)}")
                await asyncio.sleep(60)  # 오류 발생 시 1분 후 재시도
    
    async def start_system_metrics_collection(self):
        """시스템 메트릭 수집 시작"""
        asyncio.create_task(self.collect_system_metrics())
    
    def record_request_metrics(self, method: str, endpoint: str, 
                             status: int, duration: float):
        """API 요청 메트릭 기록"""
        self.request_count.labels(method=method, endpoint=endpoint, 
                                status=status).inc()
        self.request_latency.labels(method=method, endpoint=endpoint)\
            .observe(duration)
    
    def record_error(self, method: str, endpoint: str, error_type: str):
        """API 에러 메트릭 기록"""
        self.error_count.labels(method=method, endpoint=endpoint, 
                              error_type=error_type).inc()

# 전역 메트릭 수집기 인스턴스
metrics_collector = MetricsCollector() 