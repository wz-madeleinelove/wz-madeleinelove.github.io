// src/pages/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Swal from 'sweetalert2';

function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const navigate = useNavigate();

    const login = useAuthStore((s) => s.login);

const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, pw);
    if (success) {
        navigate('/admin');
    } else {
        await Swal.fire({
            title: '접근 불가',
            text: '로그인 실패 또는 관리자 권한 없음',
            confirmButtonColor: '#85d8ea',
        });
    }
};

    return (
        <div className='admin'>
            <h1>관리자 로그인</h1>
            <form className='admin-login' onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                />
                <button className='btn-mint' type="submit">로그인</button>
            </form>
        </div>
    );
}

export default AdminLoginPage;
