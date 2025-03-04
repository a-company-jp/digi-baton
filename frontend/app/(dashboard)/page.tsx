import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-lg bg-blue-800">
        <Image
          src="/imgs/welcome_icon.png"
          alt="Welcome"
          width={150}
          height={150}
          className="object-contain"
        />
        <div>
          <h1 className="text-white text-lg lg:text-2xl font-bold truncate">
            <span className="hidden md:inline">
              今すぐ連携し、もしものときに備えましょう。
            </span>
            <span className="md:hidden">もしものときに備えましょう。</span>
          </h1>
          <p className="mt-4 text-gray-100 line-clamp-2">
            <span className="hidden md:inline">
              <span className="font-bold">KeyPer</span>
              を使ってアカウント情報やデバイス情報を入力することで、
              もしものときに引き継ぎが迅速に行えます。
            </span>
            <span className="md:hidden">
              あなたのアカウントやデバイスの情報を登録しましょう。
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
