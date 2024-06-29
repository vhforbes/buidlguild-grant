import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
import { useContractRead } from "wagmi";

// type EventData = [
//   {
//     banner: string; // URL to banner
//     dataEvento: bigint; // Event date as a big integer
//     description: string; // Event Description
//     localEvento: string; // Event Location
//     logo: string; // URL to logo
//     totalArrecadado: bigint; // Total Collected
//     totalArrecadadoDesejado: bigint; // Desired Total Collection
//   },
//   string, // Ethereum address at index 1
//   string, // A test string, possibly a name or title, at index 2
//   string, // 'NF' or similar short string, possibly a type or status, at index 3
// ];

const EventDetail = ({ scrollAddress, nearAddress, abi }: any) => {
  const router = useRouter();

  const goToEventPage = (address: string) => {
    router.push(`/event-page?scrollAddress=${address}&nearAddress=${nearAddress}`);
  };

  const { data } = useContractRead({
    address: scrollAddress,
    abi: abi,
    functionName: "viewAllData",
    chainId: 534351,
  });

  const convertSecondsToDays = (secondsInput: bigint | number): number => {
    const secondsInADay = 86400;
    const seconds: number = typeof secondsInput === "bigint" ? Number(secondsInput) : secondsInput;
    const days: number = Math.round(seconds / secondsInADay);
    return days;
  };

  useEffect(() => {
    console.log(data);
  }, []);

  if (!data) return null;

  return (
    <div className="card bg-base-100 shadow-xl flex flex-col h-full">
      <figure>
        <img src={data[0].logo} alt="Shoes" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {data[2]} - {data[3]}
        </h2>
        <p>{data[0].description}</p>

        <p>Tickets lasts {convertSecondsToDays(parseInt(data[0].dataEvento))} dias para o evento!</p>

        <p>Address: {data[0].localEvento}</p>

        <div className="mb-4">
          <p>
            Total funded: <span className="font-bold text-xl">${formatUnits(data[0].totalArrecadado, 18)}</span>{" "}
          </p>
          <p>
            Fund goal: <span className="font-bold text-xl">${formatUnits(data[0].totalArrecadadoDesejado, 18)}</span>
          </p>
        </div>

        <div className="card-actions justify-center mt-auto">
          <button onClick={() => goToEventPage(scrollAddress)} className="btn btn-accent">
            Buy your ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
