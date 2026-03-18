'use client'
import { useState } from 'react'

export default function Home() {
  const [tab, setTab] = useState('login')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Montserrat', sans-serif;
          min-height: 100vh;
          background: linear-gradient(160deg, #fce4ec 0%, #fdf0f5 40%, #fce4ec 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .card {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(233,30,99,0.12);
          animation: slideUp 0.5s ease forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* HEADER */
        .header {
          background: linear-gradient(160deg, #fce4ec 0%, #fdf6f9 100%);
          padding: 40px 32px 32px;
          text-align: center;
          border-bottom: 1px solid rgba(233,30,99,0.08);
        }

        .logo-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 2px solid #e91e63;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          background: white;
        }

        .logo-circle span {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #e91e63;
          letter-spacing: 1px;
        }

        .salon-name {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #c2185b;
          letter-spacing: 3px;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .salon-tagline {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 4px;
          color: rgba(194,24,91,0.5);
          text-transform: uppercase;
        }

        /* TABS */
        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(233,30,99,0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 16px;
          background: none;
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(194,24,91,0.35);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.3s;
        }

        .tab-btn.active {
          color: #e91e63;
          border-bottom-color: #e91e63;
        }

        /* FORM */
        .form-body {
          padding: 32px;
        }

        .input-group {
          position: relative;
          margin-bottom: 16px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: rgba(233,30,99,0.4);
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          padding: 16px 16px 16px 44px;
          border: 1.5px solid rgba(233,30,99,0.2);
          border-radius: 12px;
          font-family: 'Montserrat', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #333;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          background: #fafafa;
        }

        .input-field::placeholder { color: rgba(0,0,0,0.3); }

        .input-field:focus {
          border-color: #e91e63;
          box-shadow: 0 0 0 3px rgba(233,30,99,0.08);
          background: white;
        }

        .forgot {
          text-align: right;
          margin-bottom: 24px;
          margin-top: -4px;
        }

        .forgot a {
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(194,24,91,0.5);
          text-decoration: none;
          text-transform: uppercase;
        }

        .btn-main {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #e91e63, #c2185b);
          border: none;
          border-radius: 12px;
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: white;
          cursor: pointer;
          transition: opacity 0.3s, transform 0.2s;
          margin-bottom: 24px;
        }

        .btn-main:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-main:active { transform: translateY(0); }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .divider span {
          flex: 1;
          height: 1px;
          background: rgba(233,30,99,0.1);
        }

        .divider small {
          font-size: 10px;
          letter-spacing: 2px;
          color: rgba(0,0,0,0.25);
          text-transform: uppercase;
        }

        .btn-google {
          width: 100%;
          padding: 14px;
          background: white;
          border: 1.5px solid rgba(233,30,99,0.15);
          border-radius: 12px;
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: rgba(0,0,0,0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.3s;
          margin-bottom: 28px;
        }

        .btn-google:hover { border-color: rgba(233,30,99,0.35); }

        .footer-links {
          text-align: center;
        }

        .footer-links p {
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(0,0,0,0.35);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .footer-links a {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #e91e63;
          text-decoration: underline;
          text-transform: uppercase;
          cursor: pointer;
        }

        .footer-links .forgot-link {
          display: block;
          margin-top: 8px;
          font-size: 10px;
          letter-spacing: 2px;
          color: rgba(0,0,0,0.25);
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }
      `}</style>

      <div className="card">

        {/* HEADER */}
        <div className="header">
          <div className="logo-circle">
            <span>JOU</span>
          </div>
          <div className="salon-name">JOUDAT<br/>SALON</div>
          <div className="salon-tagline">Premium Experience</div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            Entrar
          </button>
          <button
            className={`tab-btn ${tab === 'cadastro' ? 'active' : ''}`}
            onClick={() => setTab('cadastro')}
          >
            Cadastrar
          </button>
        </div>

        {/* FORM */}
        <div className="form-body">

          {tab === 'login' ? (
            <>
              <div className="input-group">
                <span className="input-icon">📱</span>
                <input
                  className="input-field"
                  type="text"
                  placeholder="E-mail, Telefone ou CPF"
                />
              </div>

              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Senha de Acesso"
                />
              </div>

              <button className="btn-main">Entrar no Salão</button>
            </>
          ) : (
            <>
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Nome Completo"
                />
              </div>

              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  className="input-field"
                  type="email"
                  placeholder="E-mail"
                />
              </div>

              <div className="input-group">
                <span className="input-icon">📱</span>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="Telefone / WhatsApp"
                />
              </div>

              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Criar Senha"
                />
              </div>

              <button className="btn-main">Criar Minha Conta</button>
            </>
          )}

          <div className="divider">
            <span></span>
            <small>ou</small>
            <span></span>
          </div>

          <button className="btn-google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <div className="footer-links">
            {tab === 'login' ? (
              <>
                <p>
                  Novo membro?{' '}
                  <a onClick={() => setTab('cadastro')}>Cadastre-se</a>
                </p>
                <a className="forgot-link">Esqueci minha senha</a>
              </>
            ) : (
              <p>
                Já tem conta?{' '}
                <a onClick={() => setTab('login')}>Entrar</a>
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
