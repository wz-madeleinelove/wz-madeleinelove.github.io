import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { Camera, LoaderCircle, X } from 'lucide-react';
import './ImageCaptureQR.css';

function ImageCaptureQR() {
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false); // ✅ 팝업 한번이라도 열렸는지

  const handleCaptureAndUpload = async () => {
    document.querySelectorAll('noscript').forEach(el => el.remove());
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.animation = 'none';
    });

    const targetUl = document.querySelector('.draw-contents h2 + ul');
    let originalMaxHeight = null;
    if (targetUl) {
      originalMaxHeight = targetUl.style.maxHeight;
      targetUl.style.maxHeight = 'none';
    }

    setLoading(true);
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        ignoreElements: (el) => el.classList.contains('no-capture'),
        windowWidth: 600,
        windowHeight: document.body.scrollHeight,
        scale: 1.5,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const formData = new FormData();
      formData.append('image', dataUrl.split(',')[1]);

      const res = await axios.post(
        'https://api.imgbb.com/1/upload?key=bbdd8322ee8f1754bf689d44582b2ad7',
        formData
      );

      if (res.data?.data?.url) {
        setQrUrl(res.data.data.url);
        setShowModal(true);
        setHasShown(true); // ✅ 한번 열린 상태 기록
      }
    } catch (err) {
      console.error('이미지 저장 실패:', err);
    } finally {
      if (targetUl && originalMaxHeight !== null) {
        targetUl.style.maxHeight = originalMaxHeight;
      }
      setLoading(false);
    }
  };

  return (
    <>
      {!hasShown && (
        <div className='no-capture'>
          <button className="btn-capture" onClick={handleCaptureAndUpload} disabled={loading}>
            {loading ? <LoaderCircle className="spinning" /> : <Camera color="#999" />}
          </button>
        </div>
      )}

      {showModal && (
        <div className="qr-modal-overlay">
          <div className="qr-modal">
            <button className="qr-close" onClick={() => setShowModal(false)}><X /></button>
            {qrUrl ? (
              <>
                <p className="qr-desc">스캔하여<br />저장된 이미지를 확인하세요</p>
                <QRCodeSVG value={qrUrl} size={128} />
              </>
            ) : (
              <p>QR 생성 실패</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ImageCaptureQR;
