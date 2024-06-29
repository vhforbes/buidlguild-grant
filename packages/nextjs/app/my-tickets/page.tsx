"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NextPage } from "next";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { abi155 } from "~~/abis/1155";
import externalContracts from "~~/contracts/externalContracts";

const MyTickets: NextPage = () => {
  // Pegar Collections
  const { data: collections } = useContractRead({
    address: externalContracts[534351].factoryERC1155.address,
    abi: externalContracts[534351].factoryERC1155.abi,
    functionName: "viewCollections",
  });

  useEffect(() => {
    console.log(collections);
  }, [collections]);

  return (
    <>
      <div className="p-10">
        <h1 className="text-2xl font-bold">Meus ingressos</h1>
        {collections?.map(address => (
          <div key={address} className="p-4 md:w-1/2 lg:w-1/3">
            {Collection({ eventAddress: address, abi155 })}
          </div>
        ))}
      </div>
    </>
  );
};

const Collection = ({ eventAddress, abi }: any) => {
  const { address: connectedAddress } = useAccount();

  const { data: collectionData } = useContractRead({
    address: eventAddress,
    abi: abi,
    functionName: "viewAllData",
  });

  //  FAZER ISSO PARA CADA COLLECTION
  const { data: ticketsBalance }: { data: any } = useContractRead({
    address: eventAddress,
    abi: abi155,
    // [[wallet, wallet wallet], [1, 2, 3]]
    args: [
      [connectedAddress, connectedAddress, connectedAddress],
      [1, 2, 3],
    ],
    functionName: "balanceOfBatch",
  }) as { data: bigint[] };

  // ---- HELPERS ----
  const hasAtLeastOneTicket = (values: bigint[] | undefined): boolean => {
    return values?.some(value => value > 0n) ?? false;
  };

  // ---- LOGGING ----
  useEffect(() => {
    // console.log(collectionData);
    console.log(ticketsBalance);
  }, [collectionData, ticketsBalance]);

  if (!collectionData || !hasAtLeastOneTicket(ticketsBalance)) return null;

  return (
    <div>
      <h2 className="card-title">
        {collectionData[2]} - {collectionData[3]}
      </h2>
      <div className="flex">
        {ticketsBalance.map((quantity: bigint, index: number) => {
          if (quantity > 0) {
            return (
              <div className="mr-6" key={index}>
                <Ticket
                  quantity={quantity.toString()}
                  tier={index}
                  name={collectionData[2]}
                  banner={collectionData[0].banner}
                  address={eventAddress}
                />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

const Ticket = ({ quantity, tier, name, banner, address }: any) => {
  const router = useRouter();
  const [extornoEnabled, setExtornoEnabled] = useState(false);

  const goToEventPage = (address: string) => {
    router.push(`/event-page?eventAddress=${address}`);
  };

  // viewUserExtorno, userExtorno(id, amount)
  const { data: viewUserExtorno } = useContractRead({
    address,
    abi: abi155,
    functionName: "viewUserExtorno",
  }) as { data: boolean };

  const { write: userExtorno } = useContractWrite({
    address,
    abi: abi155,
    args: [tier + 1, quantity],
    functionName: "userExtorno",
  });

  useEffect(() => {
    setExtornoEnabled(viewUserExtorno);
  }, [viewUserExtorno]);

  return (
    <>
      <div className="card w-96 bg-base-100 shadow-xl">
        <figure className="px-10 pt-10">
          <img src={banner} alt="Shoes" className="rounded-xl" />
        </figure>
        <div className="card-body items-center text-center">
          <h2 className="card-title">{name}</h2>
          <p>Ticker tier: {tier + 1}</p>
          <p>Tickets quantity: {quantity}</p>
          <button className="btn" onClick={() => goToEventPage(address)}>
            Ver evento
          </button>
          {extornoEnabled ? (
            <button className="btn" onClick={() => userExtorno()}>
              Refund
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default MyTickets;
