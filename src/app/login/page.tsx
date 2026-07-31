"use client";

import { motion } from "framer-motion";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Silakan masukkan alamat email Anda.";
    }

    if (!/\S+@\S+\.\S+/.test(value)) {
      return "Masukkan alamat email yang valid.";
    }

    return "";
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return "Silakan masukkan password Anda.";
    }

    return "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setPasswordError(
        "Email atau password yang Anda masukkan tidak sesuai."
      );
      return;
    }

    
    router.push(redirectUrl);
  };

  return (
    <div className={styles.container}>
      {/* ================= LEFT ================= */}

      <div className={styles.left}>
        <div className={styles.overlay}>
          <motion.h1
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
          >
            BacaKita
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 1,
              delay: 0.4,
            }}
          >
            Platform Buku Digital
            <br />
            Nikmati ribuan ebook pilihan,
            <br />
            baca kapan saja dan di mana saja.
          </motion.p>
        </div>
      </div>

      {/* ================= RIGHT ================= */}

      <div className={styles.right}>
        <motion.form
          className={styles.card}
          onSubmit={handleLogin}
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
          whileHover={{
            scale: 1.01,
          }}
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.6,
            }}
          >
            Masuk
          </motion.h2>

          {/* EMAIL */}

          <label>Email</label>

          <input
            className={emailError ? styles.inputError : ""}
            type="email"
            placeholder="Masukkan Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              if (emailError) {
                setEmailError("");
              }
            }}
            onBlur={() => {
              setEmailError(validateEmail(email));
            }}
          />

          {emailError && (
            <motion.span
              className={styles.error}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {emailError}
            </motion.span>
          )}

          {/* PASSWORD */}

          <label>Password</label>

          <input
            className={passwordError ? styles.inputError : ""}
            type="password"
            placeholder="Masukkan Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);

              if (passwordError) {
                setPasswordError("");
              }
            }}
            onBlur={() => {
              setPasswordError(validatePassword(password));
            }}
          />

          {passwordError && (
            <motion.span
              className={styles.error}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {passwordError}
            </motion.span>
          )}

         <div className={styles.forgotWrapper}>
          <span
              className={styles.forgotPassword}
               onClick={() => router.push("/forgot-password")}
            >
               Lupa Password?
            </span>
          </div>

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
            {loading ? "Memproses..." : "Masuk"}
          </motion.button>

          <p className={styles.registerText}>
            Belum punya akun?

            <span onClick={() => router.push("/register")}>
              {" "}
              Daftar Sekarang
            </span>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div style={{ display: "flex", width: "100%", height: "100vh", alignItems: "center", justifyContent: "center" }}>
          Memuat halaman masuk...
        </div>
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}