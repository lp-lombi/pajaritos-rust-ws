import React from 'react';
import './LoginPage.css';

type LoginPageProps = {
  username: string;
  password: string;
  loading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function LoginPage({
  username,
  password,
  loading,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  return (
    <form onSubmit={onSubmit} className="card-form">
      <h2>Login</h2>
      <div className="field-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type='text'
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
        />
      </div>
      <div className="field-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}

export default LoginPage;
