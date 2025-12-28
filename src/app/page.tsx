'use client'
import Image from "next/image";
import Link from "next/link";
import AppTable from "@/components/app.table";
import useSWR from "swr";

export default function Home() {
  return (
    <div 
      className="min-h-screen bg-white"
      style={{
        backgroundImage: 'url("/mil_bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      
    </div>
  );
}