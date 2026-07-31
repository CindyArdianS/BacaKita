"use client";

import Hero from "./components/Hero";
import SearchBar from "./components/SearchBar";
import Genre from "./components/Genre";
import BookSection from "./components/BookSection";

export default function DashboardPage() {
  return (
    <>
      <Hero />
      <SearchBar />
      <Genre />
      <BookSection />
    </>
  );
}