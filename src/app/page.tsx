"use client";
import Nav from "@/components/Nav";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormItem } from "@/components/ui/form";
import { ImCross } from "react-icons/im";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { games, keyAmounts } from "@/constraints/script";
import { CustomField } from "@/components/CustomField";
import { useState } from "react";
import Link from "next/link";

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
  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showBtn, setShowBtn] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showLink, setShowLink] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameName: "",
      keyAmount: "",
    },
  });

  const handleCopy = (val: any, index: number) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(val)
        .then(() => {
          setCopiedIndex(index);
          
          setTimeout(() => setCopiedIndex(null), 2000); // Reset to "Copy Text" after 2 seconds
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    }
  };

  const handleReset = () => {
    setShowLink(true)
    setShowBtn(true);
    setShowProgress(false);
    setKeys([]);
    setProgress(0);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setShowProgress(true);
    setShowBtn(false);
    const EVENTS_DELAY = 20000;
    const MAX_KEYS_PER_GAME_PER_DAY = 5;

    const initializeLocalStorage = () => {
      const now = new Date().toISOString().split("T")[0];
      Object.values(games).forEach((game) => {
        const storageKey = `keys_generated_${game.name}`;
        const storedData = localStorage.getItem(storageKey);

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.date !== now) {
            localStorage.setItem(
              storageKey,
              JSON.stringify({ date: now, count: 0 })
            );
          }
        } else {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ date: now, count: 0 })
          );
        }
      });
    };

    const generateClientId = () => {
      const timestamp = Date.now();
      const randomNumbers = Array.from({ length: 19 }, () =>
        Math.floor(Math.random() * 10)
      ).join("");
      return `${timestamp}-${randomNumbers}`;
    };

    const login = async (clientId: any, appToken: any) => {
      const response = await fetch(
        "https://api.gamepromo.io/promo/login-client",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appToken,
            clientId,
            clientOrigin: "deviceid",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to login");
      }

      const data = await response.json();
      console.log(data);
      return data.clientToken;
    };

    const emulateProgress = async (clientToken: any, promoId: any) => {
      const response = await fetch(
        "https://api.gamepromo.io/promo/register-event",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            promoId,
            eventId: generateUUID(),
            eventOrigin: "undefined",
          }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      console.log(data);
      return data.hasCode;
    };

    const generateKey = async (clientToken: any, promoId: any) => {
      const response = await fetch(
        "https://api.gamepromo.io/promo/create-code",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            promoId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate key");
      }

      const data = await response.json();
      console.log(data);
      return data.promoCode;
    };

    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    };

    const sleep = ({ ms }: any) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const delayRandom = () => Math.random() / 3 + 1;

    initializeLocalStorage();

    const gameChoice = values.gameName;
    const keyCount = parseInt(values.keyAmount);

    const game = Object.values(games).find(
      (game) => game.name.toLowerCase() === gameChoice.toLowerCase()
    );
    console.log(game);
    if (game) {
      const storageKey = `keys_generated_${game.name}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.count + keyCount > MAX_KEYS_PER_GAME_PER_DAY) {
          alert(
            `You can generate only ${
              MAX_KEYS_PER_GAME_PER_DAY - parsedData.count
            } more keys for ${
              game.name
            } today. Please contact us on Telegram for more keys.`
          );
          return;
        }
      }

      const generateKeyProcess = async () => {
        const clientId = generateClientId();
        var clientToken;
        try {
          clientToken = await login(clientId, game.appToken);
          console.log(clientToken);
        } catch (error) {
          alert(`Failed to login`);

          return null;
        }

        for (let i = 0; i < 11; i++) {
          await sleep({ ms: EVENTS_DELAY * delayRandom() });
          const hasCode = await emulateProgress(clientToken, game.promoId);
          setProgress((prev) => prev + 7 / keyCount);
          if (hasCode) {
            break;
          }
        }

        try {
          const key = await generateKey(clientToken, game.promoId);
          setProgress((prev) => prev + 30 / keyCount);
          return key;
        } catch (error) {
          alert(`Failed to generate key`);
          return null;
        }
      };
      const keys = await Promise.all(
        Array.from({ length: keyCount }, generateKeyProcess)
      );
      console.log(keys);
      setKeys(keys);
      setProgress(100);
    }
  }

  return (
    <>
      <main className="flex min-h-screen flex-col items-center">
        <Nav />
        <Link
          href="https://t.me/blum/app?startapp=ref_qtQH9Kb1zG"
          className=" w-full h-[50px] bg-white  text-black font-semibold text-[16px] flex justify-center items-center"
        >
          Click here to get Blum Airdrop🚀
        </Link>
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <CustomField
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(games).map((val, index) => (
                            <SelectItem key={index} value={val.name}>
                              {val.name}
                            </SelectItem>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {keyAmounts.map((val, index) => (
                            <SelectItem key={index} value={val}>
                              {val}
                            </SelectItem>
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
                  <Button variant="hamster" className=" w-full" type="submit">
                    Next
                  </Button>
                )}
              </form>
            </Form>
            {showProgress && (
              <div className=" mt-5">
                <div className=" w-full h-3 bg-slate-400 rounded-md ">
                  <div
                    style={{ width: `${progress}%` }}
                    className={` h-3 bg-gradient-to-r from-purple-600 via-pink-400 to-red-600 relative flex justify-end overflow-visible rounded-md`}
                  >
                    <Image
                      src={"/hamster-coin.png"}
                      width={20}
                      height={20}
                      className="absolute -right-2 top-[-45%]"
                      alt="logo"
                    />
                  </div>
                </div>
                <p className=" text-white font-semibold text-center mt-1 text-[18px]">
                  {progress === 100 ? "successful 🚀✨" : "processing..."}{" "}
                  {progress !== 100 && Math.round(progress) + "%"}
                </p>
              </div>
            )}
            {keys &&
              progress === 100 &&
              keys
                .filter((val) => val.trim() !== "") // Filter out empty strings
                .map((val, index) => (
                  <div key={index} className="w-full">
                    <div className="flex w-full mt-2 items-center justify-between bg-white/50 p-2 rounded-md">
                      <p className="text-white font-semibold text-[12px]">
                        {val}
                      </p>
                      <button
                        onClick={() => handleCopy(val, index)}
                        className="px-4 py-2 bg-[#2353FB] text-white rounded-md"
                      >
                        {copiedIndex === index ? "Copied!!" : "Copy Text"}
                      </button>
                    </div>
                  </div>
                ))}

            {keys && progress === 100 && (
              <button
                onClick={handleReset}
                className=" w-full py-2 text-white rounded-md bg-[#2353FB] mt-4"
              >
                Generate more keys
              </button>
            )}
            {showLink && (
              <div className="w-full h-screen backdrop-blur-md absolute top-0 right-0 flex justify-center items-center z-10">
                <div className=" relative w-[300px] min-h-[200px] bg-white border-2 border-[#2353FB] rounded-md flex flex-col justify-center items-center p-3">
                  <img
                    src="/blum.jpg"
                    alt="airdrop"
                    className=" rounded-md w-full h-fit"
                  />
                  <Link
                    onClick={() => setShowLink(false)}
                    className=" flex justify-center items-center mt-3 text-white font-semibold bg-black rounded-md w-full py-2"
                    href="https://t.me/Tomarket_ai_bot/app?startapp=0000p4t9"
                  >
                    Get Airdrop
                  </Link>
                  <div  onClick={() => setShowLink(false)} className="cursor-pointer absolute top-[-60px] lef-[50%] w-10 h-10 rounded-full border border-white flex justify-center items-center">
                  <ImCross  className=" text-white text-[18px]"/>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
