'use client'
import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import x from "@/styles/app.module.css"
import y from "@/styles/luan.module.css"
import 'bootstrap/dist/css/bootstrap.min.css';
import AppTable from "@/components/app.table";
import { useEffect } from "react";
import useSWR from "swr";


export default function Home() {

  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data, error, isLoading } = useSWR(
    "http://127.0.0.1:5000/data",
    fetcher,{
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false
}
    
  );
  console.log('>>> fetch', data)

  return (
  <div>
    <ul>
      <li className = {x['red']}>
        <Link href="/Global Orgchart"> 
        <span className= {y['red']}>Global Orgchart</span>
        </Link>
        
      </li>
      <li style={{margin :"20px 0"}}>
        <a href="/Customize"> Customize</a>
      </li>
      <li>
        <a href="/Orgchart"> Orgchart</a>
      </li>
    </ul>
    <AppTable/>
  </div>
  );
}
