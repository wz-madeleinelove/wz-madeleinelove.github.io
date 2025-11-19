import React, { useEffect, useState } from 'react';
import useDrawStore from '../store/useDrawStore';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import './css/admin.css';
import { Trash2, Home } from 'lucide-react';
import Swal from 'sweetalert2';
import ShippingListModal from './ShippingListModal';

function AdminPage() {
    const {
        prizes,
        displayMode,
        isLocked,
        isClosed,
        addPrize,
        updatePrize,
        deletePrize,
        setDisplayMode,
        setLocked,
        setClosed,
        saveToFirebase,
        loadFromFirebase,
        listenToFirebase,
    } = useDrawStore();

    const [showModal, setShowModal] = useState(false);
    const isAdmin = useAuthStore((s) => s.isAdmin);
    const navigate = useNavigate();
    const MAX_PRIZES = 15; // 필요 개수로 변경

    useEffect(() => {
        if (!isAdmin) {
            console.log('[Auth] 관리자 권한 없음 → /admin-login으로 이동');
            navigate('/admin-login');
        }
    }, [isAdmin, navigate]);

    useEffect(() => {
    // 초기 로드
    loadFromFirebase();

    // 실시간 구독 시작 (언서브 함수가 반환되면 클린업에서 해제)
    const unsub = typeof listenToFirebase === 'function' ? listenToFirebase() : undefined;

    return () => {
        if (typeof unsub === 'function') unsub();
    };
    }, [loadFromFirebase, listenToFirebase]); // ✅ 누락된 deps 추가

    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();           // Zustand 상태 초기화 및 localStorage 제거
        navigate('/#/admin-login');      // 홈 또는 로그인 페이지로 이동
    };

    const totalQuantity = prizes.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalRemaining = prizes.reduce((sum, p) => sum + (p.remaining || 0), 0);

    return (
        <div className='admin'>
            <div className="admin-header">
                <h1>관리자 페이지 <span>※ 상품 추가/삭제 및 결과 표시 방식 변경 후에는 ‘저장하기’를 눌러야 반영됩니다.</span></h1>
                <div className="admin-status">
                    <button
                        className="btn-white btn-icon"
                        onClick={() => navigate('/')}
                    >
                        <Home size={16} />
                    </button>
                    <button className="btn-mint" onClick={() => setShowModal(true)}>
                        배송 정보 보기
                    </button>
                    <button className="btn-purple" onClick={handleLogout}>
                        로그아웃
                    </button>
                    <button
                        className='btn-red'
                        onClick={async () => {
                            const result = await Swal.fire({
                                title: isClosed ? '럭키드로우를 다시 여시겠습니까?' : '정말로 지금 마감하시겠습니까?',
                                showCancelButton: true,
                                confirmButtonText: isClosed ? '다시 열기' : '마감하기',
                                cancelButtonText: '취소',
                                confirmButtonColor: '#85d8ea',
                            });

                            if (!result.isConfirmed) return;

                            const newClosed = !isClosed;
                            setClosed(newClosed);
                            await saveToFirebase();

                            await Swal.fire({
                                title: newClosed ? '마감되었습니다.' : '럭키드로우를 다시 열었습니다.',
                                confirmButtonColor: '#85d8ea',
                            });

                            window.location.reload();
                        }}
                    >
                        {isClosed ? '다시열기' : '마감하기'}
                    </button>
                </div>
            </div>
            <div className="admin-table">
                <table border="1" cellPadding="8">
                    <thead>
                        <tr>
                            <th>등수</th>
                            <th>상품명</th>
                            <th>전체 수량</th>
                            <th>남은 수량</th>
                            <th>삭제</th>
                            <th>배송 필요</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prizes.map((prize, index) => (
                            <tr key={index}>
                                <td>{prize.rank}등</td>
                                <td>
                                    <input
                                        type="text"
                                        value={prize.name}
                                        disabled={isLocked}
                                        onChange={(e) => updatePrize(index, { name: e.target.value })}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={prize.quantity}
                                        disabled={isLocked}
                                        onChange={(e) => {
                                            const quantity = parseInt(e.target.value);
                                            updatePrize(index, {
                                                quantity,
                                                remaining: quantity,
                                            });
                                        }}
                                    />
                                </td>
                                <td>{prize.remaining}</td>
                                <td>
                                    <button
                                        className='delete-prize'
                                        onClick={async () => {
                                            const result = await Swal.fire({
                                                title: `${prize.rank}등 상품 "${prize.name}"을 삭제하시겠습니까?`,
                                                showCancelButton: true,
                                                confirmButtonText: '삭제',
                                                cancelButtonText: '취소',
                                                confirmButtonColor: '#85d8ea',
                                            });
                                            if (result.isConfirmed) {
                                                deletePrize(index);
                                                Swal.fire({
                                                    title: '삭제되었습니다.',
                                                    text: '(반드시 저장버튼을 눌러주세요)',
                                                    confirmButtonColor: '#85d8ea',
                                                });
                                            }
                                        }}
                                        disabled={isLocked}
                                    >
                                        <Trash2 size={20} strokeWidth={1.5} />
                                    </button>
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={prize.requiresShipping || false}
                                        disabled={isLocked}
                                        onChange={(e) => updatePrize(index, { requiresShipping: e.target.checked })}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="admin-btn-wrapper">
                <button className='lock-prize btn-white' onClick={() => setLocked(!isLocked)}>
                    {isLocked ? '잠금해제' : '설정잠금'}
                </button>
                <button className='add-prize btn-white' onClick={addPrize} disabled={isLocked || prizes.length >= MAX_PRIZES}>
                    상품추가
                </button>
                <div className="admin-summary">
                    <strong>전체 수량:</strong> {totalQuantity}개 &nbsp;/&nbsp;
                    <strong>남은 수량:</strong> {totalRemaining}개
                </div>
            </div>
            <div className='admin-wrapper'>
                <div className="admin-row">
                    <h2>결과 표시 방식</h2>
                    <label>
                        <input
                            type="radio"
                            value="rank"
                            checked={displayMode === 'rank'}
                            disabled={isLocked}
                            onChange={(e) => setDisplayMode(e.target.value)}
                        /> 등수만
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="prize"
                            checked={displayMode === 'prize'}
                            disabled={isLocked}
                            onChange={(e) => setDisplayMode(e.target.value)}
                        /> 상품명만
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="both"
                            checked={displayMode === 'both'}
                            disabled={isLocked}
                            onChange={(e) => setDisplayMode(e.target.value)}
                        /> 둘 다
                    </label>
                </div>
            </div>
            <div className="admin-footer">
                <button
                    className='btn-mint'
                    onClick={async () => {
                        const result = await Swal.fire({
                            title: '저장하시겠습니까?',
                            showCancelButton: true,
                            confirmButtonText: '저장',
                            cancelButtonText: '취소',
                            confirmButtonColor: '#85d8ea',
                        });
                        if (!result.isConfirmed) return;

                        await saveToFirebase();
                        await Swal.fire({
                            title: '저장되었습니다!',
                            confirmButtonColor: '#85d8ea',
                        });
                        window.location.reload();
                    }}
                >
                    저장하기
                </button>
            </div>
            <ShippingListModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
}

export default AdminPage;
