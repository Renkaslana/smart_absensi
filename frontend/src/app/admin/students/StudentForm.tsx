'use client';

import React from 'react';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';

interface FormData {
  nim: string;
  name: string;
  email: string;
  password: string;
}

interface Props {
  modalMode: 'add' | 'edit';
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  emailLocked: boolean;
  setEmailLocked: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
  handleFormSubmit: (e: React.FormEvent) => Promise<void> | void;
}

export default function StudentForm({
  modalMode,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  emailLocked,
  setEmailLocked,
  isSubmitting,
  handleFormSubmit,
}: Props) {
  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* NIM */}
      <div>
        <label className="form-label">NIM</label>
        <input
          autoFocus
          type="text"
          value={formData.nim}
          onChange={(e) => {
            const newNim = e.target.value;
            const expectedEmail = newNim
              ? `${newNim}@mhs.harkatnegeri.ac.id`
              : '';
            setFormData((prev) => ({
              ...prev,
              nim: newNim,
              email:
                modalMode === 'add' && emailLocked
                  ? expectedEmail
                  : prev.email,
            }));
          }}
          placeholder="Masukkan NIM"
          required
          disabled={modalMode === 'edit'}
          className="input-field"
        />
      </div>

      {/* Nama */}
      <div>
        <label className="form-label">Nama Lengkap</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="Masukkan nama lengkap"
          required
          className="input-field"
        />
      </div>

      {/* Email */}
      <div>
        <label className="form-label">Email</label>

        <div className="flex items-center gap-2">
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={modalMode === 'add' && emailLocked}
            placeholder="Masukkan email"
            className={`input-field flex-1 ${
              modalMode === 'add' && emailLocked
                ? 'bg-neutral-100 text-neutral-500'
                : ''
            }`}
          />

          {modalMode === 'add' && (
            <button
              type="button"
              title={emailLocked ? 'Email terkunci' : 'Ubah email'}
              onClick={() => setEmailLocked((s) => !s)}
              className="icon-btn"
            >
              {emailLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        <p className="form-hint">
          Default:{' '}
          <span className="font-medium">
            [nim]@mhs.harkatnegeri.ac.id
          </span>
        </p>
      </div>

      {/* Password */}
      {modalMode === 'add' && (
        <div>
          <label className="form-label">Password</label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Masukkan password"
              required
              className="input-field pr-10 bg-yellow-50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-100"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="form-hint">Minimal 8 karakter</p>
        </div>
      )}

      {/* Submit */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-60"
        >
          {isSubmitting
            ? 'Menyimpan...'
            : modalMode === 'edit'
            ? 'Simpan Perubahan'
            : 'Tambah Mahasiswa'}
        </button>
      </div>
    </form>
  );
}
