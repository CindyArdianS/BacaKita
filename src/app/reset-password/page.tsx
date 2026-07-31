"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./reset-password.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [confirmError, setConfirmError] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState("");

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return "Silakan masukkan password baru.";
    }

    if (value.length < 8) {
      return "Password minimal 8 karakter.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password harus mengandung minimal 1 huruf besar.";
    }

    if (!/[a-z]/.test(value)) {
      return "Password harus mengandung minimal 1 huruf kecil.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password harus mengandung minimal 1 angka.";
    }

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(value)) {
      return "Password harus mengandung minimal 1 karakter spesial.";
    }

    return "";
  };

  const validateConfirm = (value: string) => {
    if (!value.trim()) {
      return "Silakan konfirmasi password.";
    }

    if (value !== password) {
      return "Konfirmasi password tidak sesuai.";
    }

    return "";
  };

  async function handleReset(e: React.FormEvent) {
  e.preventDefault();

  const passError = validatePassword(password);
  const confirm = validateConfirm(confirmPassword);

  setPasswordError(passError);
  setConfirmError(confirm);

  if (passError || confirm) return;

  setLoading(true);

  const { error } = await supabase.auth.updateUser({
    password,
  });

  setLoading(false);

  if (error) {
    setPasswordError(error.message);
    return;
  }

  setSuccess(
    "✅ Password berhasil diperbarui. Anda akan diarahkan ke halaman login..."
  );

  setTimeout(() => {
    router.push("/login");
  }, 2500);
}

  return (
    <div className={styles.container}>
      {/* LEFT */}

      <div className={styles.left}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className={styles.video}
        >
          <source
            src="/resetpass.mp4"
            type="video/mp4"
          />
        </video>

        <div className={styles.overlay}>
          <motion.h1
            initial={{
              opacity: 0,
              x: -80,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 1,
            }}
          >
            BacaKita
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              x: -80,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.4,
            }}
          >
            Hampir selesai.
            <br />
            Buat password baru yang
            <br />
            aman untuk akun Anda.
          </motion.p>
        </div>
      </div>

      {/* RIGHT */}

      

      <div className={styles.right}>
        <motion.form
          className={styles.card}
          onSubmit={handleReset}
          initial={{
            opacity: 0,
            x: 100,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.8,
          }}
        >
          <h2>Password Baru</h2>

          <p className={styles.subtitle}>
            Silakan buat password baru untuk akun Anda.
          </p>

          <label>Password Baru</label>

          <input
            type="password"
            placeholder="Masukkan Password Baru"
            value={password}
            className={
              passwordError
                ? styles.inputError
                : ""
            }
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
          />

          {passwordError && (
            <span className={styles.error}>
              {passwordError}
            </span>
          )}

          

          <label>
            Konfirmasi Password
          </label>

          <input
            type="password"
            placeholder="Ulangi Password Baru"
            value={confirmPassword}
            className={
              confirmError
                ? styles.inputError
                : ""
            }
            onChange={(e) => {
              setConfirmPassword(
                e.target.value
              );
              setConfirmError("");
            }}
          />

          {confirmError && (
            <span className={styles.error}>
              {confirmError}
            </span>
          )}

          <motion.button
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.97,
            }}
            disabled={loading}
            type="submit"
          >
            {loading
              ? "Menyimpan..."
              : "Simpan Password"}
          </motion.button>

          <p className={styles.back}>
            Kembali ke
            <span
              onClick={() =>
                router.push("/login")
              }
            >
              {" "}
              Login
            </span>
          </p>
        </motion.form>
      </div>
    </div>
  );
}