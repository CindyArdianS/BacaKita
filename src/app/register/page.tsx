"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [namaError, setNamaError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= VALIDASI ================= */

  const validateNama = () => {
    if (!nama.trim()) {
      setNamaError("Nama lengkap wajib diisi.");
      return false;
    }

    setNamaError("");
    return true;
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Email wajib diisi.";
    }

    const regex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!regex.test(value)) {
      return "Masukkan alamat email yang valid.";
    }

    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password wajib diisi.";
    }

    if (value.length < 8) {
      return "Password minimal 8 karakter.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password harus memiliki minimal 1 huruf besar.";
    }

    if (!/[a-z]/.test(value)) {
      return "Password harus memiliki minimal 1 huruf kecil.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password harus memiliki minimal 1 angka.";
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return "Password harus memiliki minimal 1 karakter spesial.";
    }

    return "";
  };

  /* ================= REGISTER ================= */

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const namaValid = validateNama();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (!namaValid || emailErr || passwordErr) {
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama,
        },
      },
    });

    setLoading(false);

    if (error) {
      if (
        error.message
          .toLowerCase()
          .includes("already")
      ) {
        setEmailError(
          "Email sudah terdaftar."
        );
      } else if (
        error.message
          .toLowerCase()
          .includes("email")
      ) {
        setEmailError(error.message);
      } else {
        setPasswordError(error.message);
      }

      return;
    }

    router.push("/login");
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
      preload="auto"
      className={styles.video}
    >
      <source src="/daftar.mp4" type="video/mp4" />
    </video>

    <div className={styles.overlay}>
      <h1>BacaKita</h1>

      <p>
        Bergabunglah dengan ribuan pembaca digital.
        <br />
        Nikmati ebook tanpa batas melalui
        <br />
        langganan maupun pembelian.
      </p>
    </div>
  </div>

  {/* RIGHT */}

  <div className={styles.right}>
    <form
      className={styles.card}
      onSubmit={handleRegister}
    >
      <h2>Daftar</h2>

      {/* ================= NAMA ================= */}

      <label>Nama Lengkap</label>

      <input
        className={namaError ? styles.inputError : ""}
        type="text"
        placeholder="Masukkan Nama Lengkap"
        value={nama}
        onChange={(e) => {
          setNama(e.target.value);

          if (e.target.value.trim()) {
            setNamaError("");
          }
        }}
        onBlur={validateNama}
      />

      {namaError && (
        <span className={styles.error}>
          {namaError}
        </span>
      )}

      {/* ================= EMAIL ================= */}

      <label>Email</label>

      <input
        className={emailError ? styles.inputError : ""}
        type="email"
        placeholder="contoh@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);

          if (emailError) {
            setEmailError(
              validateEmail(e.target.value)
            );
          }
        }}
        onBlur={() =>
          setEmailError(validateEmail(email))
        }
      />

      {emailError && (
        <span className={styles.error}>
          {emailError}
        </span>
      )}

      {/* ================= PASSWORD ================= */}

      <label>Password</label>

      <input
        className={
          passwordError ? styles.inputError : ""
        }
        type="password"
        placeholder="Masukkan Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);

          if (passwordError) {
            setPasswordError(
              validatePassword(e.target.value)
            );
          }
        }}
        onBlur={() =>
          setPasswordError(
            validatePassword(password)
          )
        }
      />

      {passwordError && (
        <span className={styles.error}>
          {passwordError}
        </span>
      )}

      <p className={styles.passwordInfo}>
        Demi keamanan akun Anda, gunakan password
        minimal <b>8 karakter</b> yang terdiri dari
        <b> huruf besar</b>,
        <b> huruf kecil</b>,
        <b> angka</b>,
        dan
        <b> karakter spesial</b>.
      </p>

      {/* ================= BUTTON ================= */}

      <button
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Mendaftarkan..."
          : "Daftar"}
      </button>

      <p className={styles.loginText}>
        Sudah punya akun?

        <span
          onClick={() => router.push("/login")}
        >
          {" "}
          Masuk
        </span>
      </p>
    </form>
  </div>
</div>
);
}