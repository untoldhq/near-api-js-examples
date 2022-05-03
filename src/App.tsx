import React, { useEffect, useState } from 'react'
import { Buffer } from 'buffer'
window.Buffer = Buffer
import { connect, keyStores, WalletConnection, utils } from 'near-api-js'

const App: React.FC = () => {
	const [wallet, setWallet] = useState<WalletConnection | undefined>()

	const CONTRACT_NAME = 'dev-1647636990477-84316974900111'

	const nearConfig = {
		networkId: 'testnet',
		nodeUrl: 'https://rpc.testnet.near.org',
		contractName: CONTRACT_NAME,
		walletUrl: 'https://wallet.testnet.near.org',
		helperUrl: 'https://helper.testnet.near.org',
		keyStore: new keyStores.InMemoryKeyStore(),
		headers: {}
	}

	const setup = async () => {
		const near = await connect(nearConfig)
		setWallet(new WalletConnection(near, null))
	}

	const signIn = () => {
		if (!wallet) {
			return
		}

		if (!wallet.isSignedIn()) {
      wallet.requestSignIn({
        contractId: CONTRACT_NAME,
        methodNames: ['do_a_thing'],
        successUrl: window.location + 'success',
        failureUrl: window.location + 'fail'
      });
      return
    }
	}
	
	useEffect(() => {
		setup()
	}, [])

	return <div>
		<h1>{ wallet?.getAccountId }</h1>
		<button onClick={() => signIn()}>Sign In</button>
	</div>
}
export default App
