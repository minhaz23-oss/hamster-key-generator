"use client";

import { ShowAdButton } from "@/components/showBtn";
import Nav from "@/components/Nav";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormItem,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { games,keyAmounts } from "@/constraints/script";
import { CustomField } from "@/components/CustomField";
import { useState,useEffect } from "react";

const formSchema = z.object({
  gameName: z.string().min(1, {
    message: "Please select the game",
  }),
  keyAmount: z.string().min(1, {
    message: "please select the key amount",
  }),
});

export default function Home() {

  const [keys, setKeys] = useState<string[]>([]);
  const [progress,setProgress] = useState<number>(0);
  const [showProgress,setShowProgress] = useState(false);
  const [showBtn,setShowBtn] = useState(true);
  const [copied, setCopied] = useState(false);
  // const [adController, setAdController] = useState<AdController | null>(null);
  const [showAdButton,setShowAdButton] = useState(true)

  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameName: "",
      keyAmount:''
    },
  })

  
    
    
 
  const handleCopy = (val:any) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(val).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset to "Copy Text" after 2 seconds
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  const handleReset = () => {
    setShowBtn(true);
    setShowProgress(false);
    setKeys([])
    setProgress(0)
  }

  

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setShowProgress(true);
    setShowBtn(false);
    const EVENTS_DELAY = 20000;
    const MAX_KEYS_PER_GAME_PER_DAY = 5;
    

    const initializeLocalStorage = () => {
      const now = new Date().toISOString().split('T')[0];
      Object.values(games).forEach(game => {
          const storageKey = `keys_generated_${game.name}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
              const parsedData = JSON.parse(storedData);
              if (parsedData.date !== now) {
                  localStorage.setItem(storageKey, JSON.stringify({ date: now, count: 0 }));
              }
          } else {
              localStorage.setItem(storageKey, JSON.stringify({ date: now, count: 0 }));
          }
      });
  };

  const generateClientId = () => {
    const timestamp = Date.now();
    const randomNumbers = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
    return `${timestamp}-${randomNumbers}`;
};

const login = async (clientId:any, appToken:any) => {
  const response = await fetch('https://api.gamepromo.io/promo/login-client', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          appToken,
          clientId,
          clientOrigin: 'deviceid'
      })
  });

  if (!response.ok) {
      throw new Error('Failed to login');
  }

  const data = await response.json();
  console.log(data)
  return data.clientToken;
};

const emulateProgress = async (clientToken:any, promoId:any) => {
  const response = await fetch('https://api.gamepromo.io/promo/register-event', {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          promoId,
          eventId: generateUUID(),
          eventOrigin: 'undefined'
      })
  });

  if (!response.ok) {
      return false;
  }

  const data = await response.json();
  console.log(data)
  return data.hasCode;
};

const generateKey = async (clientToken:any, promoId:any) => {
  const response = await fetch('https://api.gamepromo.io/promo/create-code', {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          promoId
      })
  });

  if (!response.ok) {
      throw new Error('Failed to generate key');
  }
  
  const data = await response.json();
  console.log(data)
  return data.promoCode;
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
};

const sleep = ({ms}:any) => new Promise(resolve => setTimeout(resolve, ms));

const delayRandom = () => Math.random() / 3 + 1;

    initializeLocalStorage();

    const gameChoice = values.gameName;
    const keyCount = parseInt(values.keyAmount)

    const game = Object.values(games).find(game => game.name.toLowerCase() === gameChoice.toLowerCase());
    console.log(game)
    if(game) {
      const storageKey = `keys_generated_${game.name}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.count + keyCount > MAX_KEYS_PER_GAME_PER_DAY) {
          alert(`You can generate only ${MAX_KEYS_PER_GAME_PER_DAY - parsedData.count} more keys for ${game.name} today. Please contact us on Telegram for more keys.`);
          return;
      }
    }

    const generateKeyProcess = async () => {
      const clientId = generateClientId();
      var clientToken;
      try {
          clientToken = await login(clientId, game.appToken);
          console.log(clientToken)
      } catch (error) {
          alert(`Failed to login`);
          
          return null;
      }
  
      for (let i = 0; i < 11; i++) {
         await sleep({ ms: EVENTS_DELAY * delayRandom() });
          const hasCode = await emulateProgress(clientToken, game.promoId);
          setProgress((prev) => prev + (7 / keyCount));
          if (hasCode) {
              break;
          }
      }
  
      try {
          const key = await generateKey(clientToken, game.promoId);
          setProgress((prev) => prev + (30 / keyCount));
          return key;
      } catch (error) {
          alert(`Failed to generate key`);
          return null;
      }
  };
  const keys = await Promise.all(Array.from({ length: keyCount }, generateKeyProcess));
  console.log(keys)
  setKeys(keys)
  setProgress(100)
  setShowAdButton(true)
  }
  

}
 
  return (
    <>
    
    <main className="flex min-h-screen flex-col items-center">
      <Nav />
      <div className="p-4">
        <div className="w-full h-[150px] flex justify-center items-end">
          <h1 className=" text-white z-10 mt-3 leading-none text-[30px] font-black text-center">
            Hamster Kombat promo key
          </h1>
          <Image
            className="absolute z-[-1] left-1/2 -translate-x-1/2"
            src={"/10.png"}
            width={150}
            height={145}
            alt="hamster"
          />
        </div>
        <div className="w-full min-h-[400px] bg-[#23212C] mt-4 rounded-lg shadow-custom-shadow p-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <CustomField 
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(games).map((val, index) => (
                          <SelectItem key={index} value={val.name}>{val.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
                name="gameName"
                formLabel="Select the game"
                className="w-full"
                control={form.control}
              />
              <CustomField 
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {keyAmounts.map((val, index) => (
                          <SelectItem key={index} value={val}>{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
                name="keyAmount"
                formLabel="Select the key amount"
                className="w-full"
                control={form.control}
              />
            {showBtn && (

              <Button variant='hamster' className=" w-full"  type="submit">Next</Button>
            )}
            </form>
          </Form>
         {showProgress && (

          <div className=" mt-5">

          <div className=" w-full h-3 bg-slate-400 rounded-md ">
            <div style={{ width: `${progress}%` }} className={` h-3 bg-gradient-to-r from-purple-600 via-pink-400 to-red-600 relative flex justify-end overflow-visible rounded-md`}>
            <Image src={'/hamster-coin.png'}  width={20} height={20} className="absolute -right-2 top-[-45%]" alt="logo" />
            </div>
          </div>
          <p className=" text-white font-semibold text-center mt-1 text-[18px]">{ progress === 100 ? 'successful 🚀✨' : 'processing...'} {progress !== 100 && Math.round(progress) + '%'}</p>
          </div>
         )}
         {(keys && progress === 100) && (
         keys.map((val, index) => (
            <div key={index} className='  w-full '>
              <div className='flex  w-full mt-2 items-center justify-between bg-white/50 p-2 rounded-md'>

               <p className=" text-white font-semibold text-[12px]">{val}</p>
               <button onClick={() => handleCopy(val)} className=" px-4 py-2 bg-[#2353FB] text-white rounded-md">{copied ? 'Copied!!' : 'Copy Text'}</button>
              </div>
              
            </div>
            ))
          )}
          {(keys && progress === 100) && (
            <button onClick={handleReset} className=" w-full py-2 text-white rounded-md bg-[#2353FB] mt-4">Generate more keys</button>
          )}
        </div>

        
      </div>
    </main>
    {showAdButton && (
      <div className=" w-full h-screen absolute z-10 left-0 top-0 flex justify-center items-center backdrop-blur-md  ">
        <div className=" w-[300px] h-[200px] bg-white border-2 border-[#23212C] rounded-md flex flex-col justify-center items-center p-3">

         <h1 className=" text-[18px] font-semibold text-[#23212C]">See one ads to continue!!</h1>
          {showAdButton && <ShowAdButton />}
        </div>
      </div>
    )}
    </>
  );
}