import React, { useState } from 'react';
import type { UserProfile, UserRole } from '../../types/lablink';
import { api, setAuthToken } from '../../lib/api';
import { ClayModal, TactileButton } from '../motion/MotionPrimitives';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Bioengineering');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === 'signin'
          ? await api.login(email, password)
          : await api.register({ email, name, password, department });
      setAuthToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoSession(role);
      setAuthToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch workspace session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClayModal open={open} onClose={onClose} maxWidthClass="max-w-md" ariaLabel="LabLink Sign In">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#29695a]">
              Campus Credentials
            </span>
            <h3 className="text-2xl font-bold text-[#1d1c15] mt-0.5">
              {mode === 'signin' ? 'Sign in to LabLink' : 'Create Researcher Account'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="w-9 h-9 rounded-full bg-[#f8f3e8] text-[#3f4945] flex items-center justify-center hover:bg-[#ede8dd] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Role-based Instant Workspace Switcher */}
        <div className="bg-[#f8f3e8] rounded-2xl p-4 clay-well flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-[#3f4945]">
            Quick Workspace Access (Server-Verified Session)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <TactileButton
              variant="primary"
              type="button"
              disabled={loading}
              onClick={() => handleQuickPersona('student')}
              className="py-2 px-3 text-xs"
            >
              Student
            </TactileButton>
            <TactileButton
              variant="secondary"
              type="button"
              disabled={loading}
              onClick={() => handleQuickPersona('faculty')}
              className="py-2 px-3 text-xs"
            >
              Faculty PI
            </TactileButton>
            <TactileButton
              variant="soft"
              type="button"
              disabled={loading}
              onClick={() => handleQuickPersona('admin')}
              className="py-2 px-3 text-xs"
            >
              Admin
            </TactileButton>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#707975]">
          <div className="flex-1 h-px bg-[#e7e2d7]" />
          <span>or use university email</span>
          <div className="flex-1 h-px bg-[#e7e2d7]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#3f4945] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. / Student Name"
                  className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm text-[#1d1c15] clay-well focus:outline-none focus:ring-2 focus:ring-[#29695a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3f4945] mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm text-[#1d1c15] clay-well focus:outline-none focus:ring-2 focus:ring-[#29695a]"
                >
                  <option value="Bioengineering">Bioengineering</option>
                  <option value="Robotics & ECE">Robotics & ECE</option>
                  <option value="Materials & Chem">Materials & Chem</option>
                  <option value="Rapid Prototyping">Rapid Prototyping</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#3f4945] mb-1">
              University Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.rivera@lablink.edu"
              className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm text-[#1d1c15] clay-well focus:outline-none focus:ring-2 focus:ring-[#29695a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3f4945] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm text-[#1d1c15] clay-well focus:outline-none focus:ring-2 focus:ring-[#29695a]"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-[#ffdad6] text-[#93000a] px-4 py-2.5 text-xs font-medium">
              {error}
            </div>
          )}

          <TactileButton
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full py-3 text-sm mt-1"
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </TactileButton>
        </form>

        <div className="text-center text-xs text-[#3f4945]">
          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className="font-semibold text-[#29695a] hover:underline cursor-pointer"
            >
              New to campus labs? Create a student account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="font-semibold text-[#29695a] hover:underline cursor-pointer"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </ClayModal>
  );
};
