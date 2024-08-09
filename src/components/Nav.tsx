import Image from "next/image";


const Nav = () => {
  return (
    <nav className=" w-full h-[60px] border-b border-white flex justify-center items-center gap-2">
      <Image src={'/hamster-coin.png'} width={40} height={40} alt="logo" />
       <h1 className=" text-white font-black text-[18px]">Hamster Kombat</h1>
    </nav>
  )
}

export default Nav;
