import React, { useEffect, useState } from 'react';

import { Button, Select, message, Spin } from 'antd';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const { Option } = Select;

interface ReportExportProps {
  reportData: any; // 보고서 데이터
  title?: string; // 보고서 제목
  includeCharts?: boolean; // 차트 포함 여부
  chartElements?: HTMLElement[]; // 차트 요소 목록 (DOM 요소)
}

/**
 * HTML 요소를 이미지 데이터 URL로 변환
 * @param element HTML 요소
 * @returns 이미지 데이터 URL을 반환하는 Promise
 */
const htmlToImage = async (element: HTMLElement): Promise<string> => {
  try {
    // html2canvas 라이브러리를 사용하여 HTML 요소를 캔버스로 변환
    const canvas = await html2canvas(element, {
      useCORS: true, // 외부 이미지 리소스 허용
      scale: 2, // 고해상도 캡처를 위한 스케일링
      logging: false, // 로깅 비활성화
      backgroundColor: '#ffffff' // 배경색 설정
    });
    
    // 캔버스를 이미지 데이터 URL로 변환
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('HTML 요소 이미지 변환 오류:', error);
    
    // 오류 발생 시 대체 이미지 생성
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = element.clientWidth || 600;
    fallbackCanvas.height = element.clientHeight || 400;
    const ctx = fallbackCanvas.getContext('2d');
    
    if (ctx) {
      // 임시 테스트용 데모 차트 그리기
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '14px Arial';
      ctx.fillText('이미지 변환 오류 발생', 50, 30);
    }
    
    return fallbackCanvas.toDataURL('image/png');
  }
};

/**
 * 보고서 내보내기 컴포넌트
 * PDF, Excel 형식으로 보고서를 내보낼 수 있는 기능 제공
 */
const ReportExport: React.FC<ReportExportProps> = ({ 
  reportData, 
  title = '보고서', 
  includeCharts = false,
  chartElements = []
}) => {
  const [exportType, setExportType] = useState<string>('pdf');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleExport = () => {
    if (exportType === 'pdf') {
      exportToPDF();
    } else if (exportType === 'excel') {
      exportToExcel();
    }
  };

  /**
   * 데이터를 PDF로 내보내는 함수
   */
  const exportToPDF = async () => {
    try {
      setIsLoading(true);
      const doc = new jsPDF();
      
      // 문서 정보 설정
      doc.setProperties({
        title: title,
        subject: '차량 관리 시스템 보고서',
        author: '차량 관리 시스템',
        keywords: '차량, 정비, 보고서',
        creator: '차량 관리 시스템'
      });
      
      // 제목 추가
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      // 날짜 추가
      doc.setFontSize(12);
      doc.text(`생성일: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // 데이터 유형 확인 (객체 배열 또는 단일 객체)
      const dataArray = Array.isArray(reportData) ? reportData : [reportData];
      
      // 데이터가 비어있는 경우 처리
      if (dataArray.length === 0) {
        doc.text('데이터가 없습니다.', 14, 40);
        doc.save(`${title}.pdf`);
        message.success('PDF 보고서가 생성되었습니다.');
        setIsLoading(false);
        return;
      }
      
      // 표 헤더 생성
      const headers = Object.keys(dataArray[0]).filter(key => 
        // 복잡한 객체나 배열 필드 제외
        typeof dataArray[0][key] !== 'object' || dataArray[0][key] === null
      );
      
      // 표 데이터 생성
      const rows = dataArray.map(item => 
        headers.map(key => {
          const value = item[key];
          
          // 값이 null 또는 undefined인 경우 빈 문자열 반환
          if (value === null || value === undefined) return '';
          
          // 날짜 형식 변환
          if (value instanceof Date) return value.toLocaleDateString();
          
          // 객체인 경우 JSON 문자열로 변환
          if (typeof value === 'object') return JSON.stringify(value);
          
          return String(value);
        })
      );
      
      // 표 생성
      (doc as any).autoTable({
        head: [headers.map(header => {
          // 헤더 텍스트 가공 (카멜케이스 -> 공백으로 구분, 첫 글자 대문자)
          return header
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
        })],
        body: rows,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [44, 62, 80],
          lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { top: 40 }
      });
      
      // 차트 포함 
      if (includeCharts) {
        // 차트 요소가 제공된 경우
        if (chartElements.length > 0) {
          doc.addPage();
          doc.setFontSize(16);
          doc.text("차트 및 그래프", 14, 20);
          
          let yPosition = 30;
          
          // 각 차트 요소를 이미지로 변환하여 PDF에 추가
          for (let i = 0; i < chartElements.length; i++) {
            try {
              // 차트 요소를 이미지로 변환
              const imageData = await htmlToImage(chartElements[i]);
              
              // 이미지 크기 조정
              const imgWidth = 180;
              const imgHeight = 100;
              
              // 이미지 추가
              doc.addImage(imageData, 'PNG', 14, yPosition, imgWidth, imgHeight);
              
              // 다음 이미지 위치 조정
              yPosition += imgHeight + 20;
              
              // 페이지 넘김 처리
              if (yPosition > 250 && i < chartElements.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            } catch (error) {
              console.error(`차트 이미지 변환 오류 (차트 ${i + 1}):`, error);
            }
          }
        } else {
          // 차트 요소가 없는 경우 데모 차트 생성
          doc.addPage();
          doc.setFontSize(16);
          doc.text("차트 페이지", 14, 20);
          doc.setFontSize(12);
          doc.text("차트를 포함하려면 chartElements 속성을 통해 DOM 요소를 전달하세요.", 14, 30);
          
          // 데모 차트 생성 (임의의 막대 차트)
          const canvas = document.createElement('canvas');
          canvas.width = 500;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // 배경
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, 500, 300);
            
            // 막대 차트
            const barData = [120, 80, 150, 90, 60];
            const colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#5F6368'];
            
            for (let i = 0; i < barData.length; i++) {
              ctx.fillStyle = colors[i];
              ctx.fillRect(50 + i * 90, 250 - barData[i], 70, barData[i]);
              
              ctx.fillStyle = '#333';
              ctx.font = '12px Arial';
              ctx.fillText(`항목 ${i+1}`, 60 + i * 90, 270);
            }
            
            // 제목
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('샘플 데이터 차트', 180, 30);
            
            // 이미지 추가
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 14, 40, 180, 100);
          }
        }
      }
      
      // PDF 저장
      doc.save(`${title}.pdf`);
      message.success('PDF 보고서가 생성되었습니다.');
    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      message.error('PDF 내보내기 오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 데이터를 Excel로 내보내는 함수
   */
  const exportToExcel = () => {
    try {
      setIsLoading(true);
      // 데이터 유형 확인 (객체 배열 또는 단일 객체)
      const dataArray = Array.isArray(reportData) ? reportData : [reportData];
      
      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(dataArray);
      
      // 워크북 생성 및 워크시트 추가
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));
      
      // Excel 파일 저장
      XLSX.writeFile(workbook, `${title}.xlsx`);
      message.success('Excel 보고서가 생성되었습니다.');
    } catch (error) {
      console.error('Excel 내보내기 오류:', error);
      message.error('Excel 내보내기 오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <Select
        value={exportType}
        onChange={(value: string) => setExportType(value)}
        style={{ width: 120, marginRight: 10 }}
        disabled={isLoading}
      >
        <Option value="pdf">PDF</Option>
        <Option value="excel">Excel</Option>
      </Select>
      <Button 
        type="primary" 
        onClick={handleExport}
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? '내보내는 중...' : '보고서 내보내기'}
      </Button>
    </div>
  );
};

export default ReportExport;
