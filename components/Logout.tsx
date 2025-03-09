import { signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import React from "react";

const Logout = () => {
  const router = useRouter()
  return <button className="px-2 bg-white text-black" onClick={async () => {
    await signOut();
    router.push('/signup')
  }
  }> Sign Out</button >;
}


export default Logout;