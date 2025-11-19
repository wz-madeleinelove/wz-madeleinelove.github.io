// src/components/ShippingFormModal.jsx
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import Swal from 'sweetalert2';
import './css/ShippingFormModal.css'; // 아래 스타일 참고

function ShippingFormModal({ prizes = [], onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [agreed, setAgreed] = useState(false);

  const shippingPrizes = prizes
    .filter((p) => p.requiresShipping)
    .map((p) => ({
      rank: p.rank,
      name: p.name,
      count: p.count || 1,
    }));

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) {
      await Swal.fire({
        title: '개인정보 수집 및 이용에 동의해주세요.',
        confirmButtonColor: '#85d8ea',
      });
      return;
    }

    const prizeText = shippingPrizes
      .map((p) => `${p.rank}등 - ${p.name} (${p.count}개)`)
      .join('\n');

    const confirmResult = await Swal.fire({
      title: '입력한 정보를 확인해주세요',
      html: `
        <strong>이름:</strong> ${form.name}<br/>
        <strong>연락처:</strong> ${form.phone}<br/>
        <strong>주소:</strong> ${form.address || '(없음)'}<br/><br/>
        <strong>당첨 상품:</strong><br/>${prizeText.replace(/\n/g, '<br/>')}
      `,
      showCancelButton: true,
      confirmButtonText: '제출하기',
      cancelButtonText: '취소',
      confirmButtonColor: '#85d8ea',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await addDoc(collection(db, 'shippingInfo'), {
        ...form,
        prizes: shippingPrizes,
        createdAt: new Date(),
      });

      await Swal.fire({
        title: '배송 정보가 제출되었습니다!',
        confirmButtonColor: '#85d8ea',
      });

      onClose(); // 모달 닫기
    } catch (err) {
      console.error('저장 오류:', err);
      await Swal.fire({
        title: '저장에 실패했습니다.',
        text: '잠시 후 다시 시도해주세요.',
        confirmButtonColor: '#85d8ea',
      });
    }
  };

  return (
    <div className="shipping-modal-overlay modal-root">
      <div className="shipping-modal">
        <h2>배송 정보 입력</h2>
        <form onSubmit={handleSubmit} className="shipping-form">
          {shippingPrizes.length > 0 && (
            <div className="shipping-prize-summary">
              <h4>배송이 필요한 당첨 내역</h4>
              <ul>
                {shippingPrizes.map((p, idx) => (
                  <li key={idx}>
                    {p.rank}등 - {p.name} ({p.count}개)
                  </li>
                ))}
              </ul>
            </div>
          )}
          <label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder='이름' />
          </label>
          <label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange} required placeholder='연락처' />
          </label>
          <label>
            <textarea name="address" value={form.address} onChange={handleChange} placeholder='주소' />
          </label>
          <label className="checkbox-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            개인정보 수집 및 이용에 동의합니다
            <div style={{ fontSize: '13px', color: '#777', marginTop: '4px' }}>
              목적: 배송 / 이벤트 종료 후 즉시 폐기됩니다.
            </div>
          </label>
          <div className="shipping-form-buttons">
            <button type="submit" className="btn-mint">제출하기</button>
            <button type="button" className="btn-red" onClick={onClose}>닫기</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShippingFormModal;
