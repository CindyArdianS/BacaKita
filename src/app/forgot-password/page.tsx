"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Silakan masukkan alamat email Anda.";
    }

    if (!/\S+@\S+\.\S+/.test(value)) {
      return "Masukkan alamat email yang valid.";
    }

    return "";
  };

  const handleReset = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const validation = validateEmail(email);

    setEmailError(validation);

    if (validation) return;

    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            "http://localhost:3000/reset-password",
        }
      );

    setLoading(false);

    if (error) {
      setEmailError(error.message);
      return;
    }

    setSuccess(
      "Tautan berhasil dikirim. Silakan cek email Anda."
    );
  };

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
          <source src="/forgotpass.mp4" type="video/mp4" />
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
            Jangan khawatir.
            <br />
            Kami akan membantu Anda
            <br />
            mengatur ulang password akun.
          </motion.p>
        </div>
      </div>

      {/* RIGHT */}

      <div className={styles.right}>
        <motion.form
          onSubmit={handleReset}
          className={styles.card}
          initial={{
            opacity: 0,
            x: 100,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
        >
          <h2>Lupa Password</h2>

          <p className={styles.subtitle}>
            Masukkan email aktif yang telah anda daftarkan.
          </p>

          <label>Email</label>

          <input
            type="email"
            placeholder="Masukkan Email"
            value={email}
            className={
              emailError
                ? styles.inputError
                : ""
            }
            onChange={(e) => {
              setEmail(e.target.value);

              setEmailError("");
            }}
          />

          {emailError && (
            <span className={styles.error}>
              {emailError}
            </span>
          )}

          {success && (
            <span className={styles.success}>
              {success}
            </span>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Mengirim..."
              : "Kirim Tautan Atur Ulang Password"}
          </button>

          <p className={styles.back}>
            Ingat password?

            <span
              onClick={() =>
                router.push("/login")
              }
            >
              {" "}
              Kembali ke Login
            </span>
          </p>
        </motion.form>
      </div>
    </div>
  );
}