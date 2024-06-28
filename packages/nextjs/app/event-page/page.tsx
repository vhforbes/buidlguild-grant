"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NextPage } from "next";
import { formatUnits, parseEther } from "viem";
import * as chains from "viem/chains";
import { useContractRead, useContractWrite, useNetwork, useSwitchNetwork } from "wagmi";
import { abi155 } from "~~/abis/1155";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

type EventData = [
  {
    banner: string; // URL to banner
    dataEvento: string; // Event date as a big integer
    description: string; // Event Description
    localEvento: string; // Event Location
    logo: string; // URL to logo
    totalArrecadado: string; // Total Collected
    totalArrecadadoDesejado: string; // Desired Total Collection
  },
  string, // Address [1]
  string, // Name [2]
  string, // Ticker [3]
];

interface TierInfo {
  index: string;
  priceInUsd: string;
  sold: string;
  maxQuantity: string;
  amount: string;
}

interface tiersData {
  tierOne?: TierInfo;
  tierTwo?: TierInfo;
  tierThree?: TierInfo;
  [key: string]: TierInfo | undefined; // Add this line
}

const EventPage: NextPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventPageContent />
    </Suspense>
  );
};

const EventPageContent = () => {
  const searchParams = useSearchParams();
  const scrollAddress = searchParams.get("scrollAddress") as string;
  // const nearAddress = searchParams.get("nearAddress") as string; Will i need this ??

  const [tiersData, setTiersData] = useState<tiersData>({});

  const [approveArgs, setApproveArgs] = useState<[string | undefined, bigint | undefined]>([scrollAddress, undefined]);
  const [buyArgs, setBuyArgs] = useState<[string | undefined, string | undefined]>();

  const [triggerApprove, setTriggerApprove] = useState(false);

  const [withdrawEnabled, setWithdrawEnabled] = useState(false);

  const { switchNetwork } = useSwitchNetwork();
  const { chain } = useNetwork();

  const [isScroll, setIsScroll] = useState(false);
  const [isNear, setIsNear] = useState(false);

  const { data: eventData } = useContractRead({
    address: scrollAddress,
    abi: abi155,
    functionName: "viewAllData",
    chainId: 534351,
  }) as { data: EventData };

  // ---- HELPERS -----
  const convertToUsd = (value: bigint) => {
    return formatUnits(value, 18);
  };

  const handleBuy = (tierKey: keyof tiersData) => {
    const tier = tiersData[tierKey];
    if (!tier) return;

    const totalValueInUsd = parseInt(tier.amount) * parseInt(tier.priceInUsd);

    const totalValueInWei = parseEther(totalValueInUsd.toString());

    setApproveArgs([scrollAddress, totalValueInWei]);
    setBuyArgs([tier.index, tier.amount]);

    setTriggerApprove(!triggerApprove);
  };

  useEffect(() => {
    approveUsd();
  }, [triggerApprove]);

  const updateAmountForTier = (tierKey: keyof tiersData, newValue: string) => {
    setTiersData(prevData => {
      // Ensure the tier exists in the data before attempting to update it
      const existingTier = prevData[tierKey];
      if (!existingTier) return prevData; // Return previous state if tier doesn't exist

      return {
        ...prevData,
        [tierKey]: {
          ...existingTier,
          amount: newValue, // Update the amount for the specific tier
        },
      };
    });
  };

  // CONTRACTS INTERACTION
  const { writeAsync: approveUsd } = useScaffoldContractWrite({
    contractName: "usdTeste",
    functionName: "approve",
    // [address, totalValue]
    args: approveArgs,
    blockConfirmations: 1,
    onBlockConfirmation: txnReceipt => {
      console.log(txnReceipt);
      write();
    },
  });

  const { write } = useContractWrite({
    address: scrollAddress,
    abi: abi155,
    // [id do tier 1 ou 2 ou 3, quantidade de ingressos]
    args: buyArgs,
    functionName: "buyTicket",
    chainId: 534351,
  });

  // TIERS
  // [PRICE, SOLD, MAX_QNT]
  // [wei, int, int]
  const { data: tierOne } = useContractRead({
    address: scrollAddress,
    abi: abi155,
    args: ["1"],
    functionName: "viewTicketData",
    chainId: 534351,
  }) as { data: bigint[] };

  const { data: tierTwo }: { data: any } = useContractRead({
    address: scrollAddress,
    abi: abi155,
    args: ["2"],
    functionName: "viewTicketData",
    chainId: 534351,
  }) as { data: bigint[] };

  const { data: tierThree }: { data: any } = useContractRead({
    address: scrollAddress,
    abi: abi155,
    args: ["3"],
    functionName: "viewTicketData",
    chainId: 534351,
  }) as { data: bigint[] };

  // Effect for Tier Updates
  useEffect(() => {
    console.log(tierOne);
    if (tierOne) {
      setTiersData(prevData => ({
        ...prevData,
        tierOne: {
          index: "1",
          priceInUsd: convertToUsd(tierOne[0]),
          sold: tierOne[1].toString(),
          maxQuantity: tierOne[2].toString(),
          amount: "1",
        },
      }));
    }
  }, [tierOne]);

  useEffect(() => {
    if (tierTwo)
      if (tierTwo[0] > 0) {
        setTiersData(prevData => ({
          ...prevData,
          tierTwo: {
            index: "2",
            priceInUsd: convertToUsd(tierTwo[0]),
            sold: tierTwo[1].toString(),
            maxQuantity: tierTwo[2].toString(),
            amount: "1",
          },
        }));
      }
  }, [tierTwo]);

  useEffect(() => {
    if (tierThree)
      if (tierThree[0] > 0) {
        setTiersData(prevData => ({
          ...prevData,
          tierThree: {
            index: "3",
            priceInUsd: convertToUsd(tierThree[0]),
            sold: tierThree[1].toString(),
            maxQuantity: tierThree[2].toString(),
            amount: "1",
          },
        }));
      }
  }, [tierThree]);

  // // IMPLEMENTAR SUCESSO ????
  // useEffect(() => {
  //   notification.success("Você comprou seu ingresso!");
  // }, [isSuccess]);

  // ---- WITHDRAW LOGIC ----
  // ownerCollect, viewOwnerCollect
  const { data: viewOwnerCollect } = useContractRead({
    address: scrollAddress,
    abi: abi155,
    functionName: "viewOwnerCollect",
    chainId: 534351,
  }) as { data: boolean };

  const { write: ownerCollect } = useContractWrite({
    address: scrollAddress,
    abi: abi155,
    functionName: "ownerCollect",
    chainId: 534351,
  });

  useEffect(() => {
    setWithdrawEnabled(viewOwnerCollect);
  }, [viewOwnerCollect]);

  useEffect(() => {
    setIsScroll(checkIsScroll());
    setIsNear(checkIsNear());
  }, [chain]);

  // ----- CHAIN CONTROL -----

  const checkIsScroll = () => {
    if (chain?.name === chains.scrollSepolia.name) {
      return true;
    }

    return false;
  };

  const checkIsNear = () => {
    if (chain?.name === chains.auroraTestnet.name) {
      return true;
    }

    return false;
  };

  if (!eventData) return null;

  // --- COMPONENTS ---
  const renderTiers = () => {
    // Transform tiersData object into an array of entries [key, value]
    const tierEntries = Object.entries(tiersData);

    // Map over each entry to create UI components
    return tierEntries.map(([tierKey, tierValue]) => {
      if (!tierValue) return null; // In case a tier is undefined

      const availableTickets = parseInt(tierValue.maxQuantity) - parseInt(tierValue.sold);

      return (
        <div key={tierKey} className="w-fit p-5 bg-base-300 rounded-xl mr-8">
          <div className="flex justify-between font-bold text-2xl">
            <p>Lote: {tierValue.index}</p>
            <p>-</p>
            <p>Preço: ${parseFloat(tierValue.priceInUsd)}</p>
          </div>
          <p className="font-bold text-xl">Ingressos Disponiveis: {availableTickets}</p>

          <input
            type="number"
            value={tierValue.amount}
            onChange={e => updateAmountForTier(tierKey as keyof tiersData, e.target.value)}
            className="input input-bordered input-primary w-full max-w-xs"
          />
          {/* //  Here is the last issue, the approve USD must aprove the value according to the 
          current ammount of the tier 
          but since it is a hook i cant just call it as a function and pass parameters to it i dont know what to do
          i tought of creating a state that when the user clicks it defines the tier he is buying and then call the aprove accordinglly

          */}
          <div className="flex justify-center py-10">
            <button
              className="btn badge-neutral m-2"
              onClick={() => {
                if (!isScroll) {
                  switchNetwork?.(chains.scrollSepolia.id);
                }

                if (isScroll) {
                  handleBuy(tierKey);
                }
              }}
            >
              COMPRAR SCROLL
            </button>
            <button
              onClick={() => {
                if (!isNear) {
                  switchNetwork?.(chains.auroraTestnet.id);
                }

                if (isNear) {
                  handleBuy(tierKey);
                }
              }}
              className="btn badge-neutral m-2"
            >
              COMPRAR NEAR
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <div className="flex flex-col">
        {/* BACKGROUND */}
        <div
          className="w-full h-60 text-center bg-cover bg-center"
          style={{
            backgroundImage: `url(${eventData[0].banner})`,
          }}
        >
          {/* You can place content here if needed, otherwise leave it empty for just a background image */}
        </div>
        {/* ROUNDED LOGO */}
        <div className="w-full flex justify-center items-center absolute top-[200px]">
          <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center overflow-hidden">
            <img src={eventData[0].logo} alt="Logo" className="object-cover w-full h-full" />
          </div>
        </div>

        {/* EVENT INFO SECTION */}
        <div className="flex justify-around bg-secondary p-10">
          <div className="bg-accent p-4 rounded-lg w-80">
            <p className="text-2xl font-bold">{eventData[2]}</p>
            <p>Endereço: {eventData[0].localEvento}</p>
            <p>Faltam {parseInt(eventData[0].dataEvento)} dias para o evento!</p>
            <p>
              Total arrecadado:{" "}
              <span className="font-bold text-xl">${parseInt(eventData[0].totalArrecadado) / 10 ** 18}</span>
            </p>
            <p>
              Objetivo de arrecadação:{" "}
              <span className="font-bold text-xl">${parseInt(eventData[0].totalArrecadadoDesejado) / 10 ** 18}</span>
            </p>
          </div>

          {/* IF TOTAL_SUPPLY = SOLD_SUPPLY */}
          {withdrawEnabled ? (
            <button className="btn mt-20" onClick={() => ownerCollect()}>
              SACAR
            </button>
          ) : null}

          <div className="bg-accent p-4 rounded-lg w-80">
            <p>{eventData[0].description}</p>
          </div>
        </div>

        {/* 
        TIERS SECTION
        // [preco, quantidadeVendida, quantidadeMaxima]
        */}
        <div className="p-10 flex flex-wrap">{renderTiers()}</div>
      </div>
    </>
  );
};

export default EventPage;
