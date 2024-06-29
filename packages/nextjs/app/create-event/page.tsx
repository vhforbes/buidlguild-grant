"use client";

import { useState } from "react";
import { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { InputBase } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const CreateEvent: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const usdContract_ = deployedContracts[11155111].usdTeste.address;

  const [eventName, setEventName] = useState<string>("Name");
  const [eventLocal, setEventLocal] = useState<string>("Local");
  const [eventDescription, setEventDescription] = useState<string>("Description");
  const [symbol, setSymbol] = useState<string>("NF");
  const [logoUrl, setLogoUrl] = useState<string>("/logo1.png");
  const [bannerUrl, setBannerUrl] = useState<string>("/bg1.png");
  const [desiredAmount, setDesidedAmount] = useState<string>("1000");

  const [howManyDays, setHowManyDates] = useState<string>("100");

  const [eventTiers, setEventTiers] = useState<Array<{ id: number; price: string; maxSupply: string }>>([]);
  const [newTierPrice, setNewTierPrice] = useState<string>("");
  const [newTierMaxSupply, setNewTierMaxSupply] = useState<string>("");

  const addTier = () => {
    setEventTiers([...eventTiers, { id: eventTiers.length, price: newTierPrice, maxSupply: newTierMaxSupply }]);
    setNewTierPrice("");
    setNewTierMaxSupply("");
  };

  const removeTier = (tierId: number) => {
    const filteredTiers = eventTiers.filter(tier => tier.id !== tierId);
    setEventTiers(filteredTiers);
    // Should also update the index of current elements so if I delete the 0 i wont create two index 1

    const updatedTiers = filteredTiers.map((tier, index) => ({
      ...tier,
      id: index, // Reassign the `id` based on the current index
    }));

    setEventTiers(updatedTiers);
  };

  const buildData_ = () => {
    return {
      description: eventDescription,
      dataEvento: BigInt(howManyDays),
      localEvento: eventLocal,
      logo: logoUrl,
      banner: bannerUrl,
      totalArrecadado: BigInt(0), // Example value
      totalArrecadadoDesejado: parseEther(desiredAmount), // Example desired amount
    };
  };

  // PROBLEMA NO FACTORY CRIANDO COM VALORES ERRADOS !!!
  const buildTicketsPrice_ = () => {
    return eventTiers.map(tier => parseEther(tier.price));
  };

  const buildTicketsMaxSupply_ = () => {
    return eventTiers.map(tier => BigInt(tier.maxSupply));
  };

  // const ticketsPrice = [BigInt("10000000000000000000")];
  // const ticketsSupply = [BigInt(10)];

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "factoryERC1155",
    functionName: "createEvent",
    args: [
      buildData_(),
      connectedAddress,
      eventName,
      symbol,
      usdContract_,
      buildTicketsPrice_(), // AQUI ? COMO DEVERIA VIR ?
      buildTicketsMaxSupply_(),
    ],
    blockConfirmations: 1,

    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
      console.log([
        buildData_(),
        connectedAddress,
        eventName,
        symbol,
        usdContract_,
        buildTicketsPrice_(), // AQUI ? COMO DEVERIA VIR ?
        buildTicketsMaxSupply_(),
      ]);
    },
  });

  // TODO - CRIAR UMX DE DATA PARA O EVENTO
  return (
    <>
      <div className="flex flex-col p-20">
        <div>
          <h1 className="text-xl font-bold">Create Event:</h1>
          <div>
            <p>Event name:</p>
            <InputBase value={eventName} onChange={setEventName} />
          </div>
          <div>
            <p>Event local:</p>
            <InputBase value={eventLocal} onChange={setEventLocal} />
          </div>
          <div>
            <p>Event description:</p>
            <InputBase value={eventDescription} onChange={setEventDescription} />
          </div>

          <div>
            <p>Days to event:</p>
            <InputBase value={howManyDays} onChange={setHowManyDates} placeholder="DD-MM-YYYY" />
          </div>
          <div>
            <p>Logo url:</p>
            <InputBase value={logoUrl} onChange={setLogoUrl} />
          </div>
          <div>
            <p>Banner url:</p>
            <InputBase value={bannerUrl} onChange={setBannerUrl} />
          </div>
          <div>
            <p>Event ticker:</p>
            <InputBase value={symbol} onChange={setSymbol} />
          </div>
          <div>
            <p>Goal:</p>

            {/* Ensure this uses the correct variable for setting the state, fixing the potential typo */}
            <InputBase value={desiredAmount} onChange={setDesidedAmount} />
          </div>
        </div>

        <div>
          <p>Event tiers:</p>
          {/* Render existing tiers */}
          {eventTiers.map((tier, index) => (
            <div className="border-2 border-black flex" key={index}>
              <div>
                <p>Quantity: {tier.maxSupply}</p>
              </div>

              <div>
                <p>Price: {tier.price}</p>
              </div>

              <button className="btn" onClick={() => removeTier(tier.id)}>
                Delete
              </button>
            </div>
          ))}

          <button
            disabled={eventTiers.length >= 3}
            className="btn"
            onClick={() => document.getElementById("tier_modal")?.showModal()}
          >
            Add tier
          </button>

          <dialog id="tier_modal" className="modal">
            <div className="modal-box">
              <p>Price</p>
              <InputBase value={newTierPrice} onChange={setNewTierPrice} />
              <p>Tickets total</p>
              <InputBase value={newTierMaxSupply} onChange={setNewTierMaxSupply} />

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="btn mr-4 bg-red-600">Close</button>
                  <button onClick={addTier} className="btn bg-green-600">
                    Add
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        </div>

        <p className="text-2xl text-warning text-center font-bold">IMPORTANTE! MINTAR EM AMBAS AS REDES</p>

        <div className="flex justify-center py-10">
          <button
            className="btn badge-neutral m-4"
            onClick={() => {
              writeAsync();
            }}
          >
            MINT EVENT
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateEvent;
