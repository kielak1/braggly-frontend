import "@/styles/globals.css";
const AccountPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">Stan konta</h1>
            <p>Saldo: 100 kredytów</p>
            <button className="mt-4 p-2 bg-blue-500 text-white rounded">Doładuj konto</button>
        </div>
    );
};

export default AccountPage;
