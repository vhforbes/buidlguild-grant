"use client";

// import Link from "next/link";
// import { useEffect } from "react";
import type { NextPage } from "next";
import { useContractRead } from "wagmi";
import { abi155 } from "~~/abis/1155";
import EventDetail from "~~/components/EventDetail";
import externalContracts from "~~/contracts/externalContracts";

// import { useAccount } from "wagmi";
// import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  // const [eventDetails, setEventsDetails] = useState<string[]>();

  // const { data: collections } = useScaffoldContractRead({
  //   contractName: "factoryERC1155",
  //   functionName: "viewCollections",
  // });

  const { data: collectionsScroll } = useContractRead({
    address: externalContracts[534351].factoryERC1155.address,
    abi: externalContracts[534351].factoryERC1155.abi,
    functionName: "viewCollections",
    chainId: 534351,
  });

  const { data: collectionsNear } = useContractRead({
    address: externalContracts[1313161555].factoryERC1155.address,
    abi: externalContracts[1313161555].factoryERC1155.abi,
    functionName: "viewCollections",
    chainId: 1313161555,
  });

  // if (!collections) {
  //   notification.error("Parece que não existe nenhum evento, vamos criar o primeiro!");
  //   router.push("/create-event");
  // }

  if (collectionsScroll?.length === 0) return;

  return (
    <>
      <div className="flex justify-around flex-grow p-10">
        <div className="flex flex-wrap -m-4 w-full">
          {/* Causing hydration eror and i dont know why */}
          {collectionsScroll?.map((address, index) => (
            <div key={address} className="p-4 md:w-1/2 lg:w-1/3">
              <EventDetail
                scrollAddress={address}
                nearAddress={collectionsNear ? collectionsNear[index] : null}
                abi={abi155}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
