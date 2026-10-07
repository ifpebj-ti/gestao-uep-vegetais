import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
}) => {
  if (!googleClientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3.5 text-sm font-bold text-slate-400"
      >
        Login com Google indisponível
      </button>
    );
  }

  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      onError();
      return;
    }
    onSuccess(response.credential);
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={onError}
        text="signin_with"
        theme="outline"
        size="large"
        shape="rectangular"
        width="360"
      />
    </div>
  );
};
