import React, { useEffect, useState } from 'react'
import { Buffer } from 'buffer'
window.Buffer = Buffer
import { connect, keyStores, WalletConnection, transactions, KeyPair } from 'near-api-js'
import { base_decode } from 'near-api-js/lib/utils/serialize'
import { PublicKey } from 'near-api-js/lib/utils'



const App: React.FC = () => {
	const [wallet, setWallet] = useState<WalletConnection | undefined>()

	const CONTRACT_NAME = 'dev-1647636990477-84316974900111'

	const nearConfig = {
		networkId: 'testnet',
		nodeUrl: 'https://rpc.testnet.near.org',
		walletUrl: 'https://wallet.testnet.near.org',
		helperUrl: 'https://helper.testnet.near.org',
		keyStore: new keyStores.BrowserLocalStorageKeyStore(),
		headers: {}
	}

	const setup = async () => {
		const near = await connect(nearConfig)
		setWallet(new WalletConnection(near, "untold-demos"))
	}

	const signIn = () => {
		if (!wallet) {
			return
		}

		if (!wallet.isSignedIn()) {
      wallet.requestSignIn({
        contractId: CONTRACT_NAME,
        methodNames: ['nft_tokens_for_owner'],
        successUrl: window.location + 'success',
        failureUrl: window.location + 'fail'
      });
      return
    }
	}
	const signInFullAccess = () => {
		if (!wallet) {
			return
		}
	
		if (!wallet.isSignedIn()) {
			wallet.requestSignIn({
				successUrl: window.location + 'success',
				failureUrl: window.location + 'fail'
			});
			return
		}
	}
	const signOut = () => {
		wallet?.signOut()
		window.location.href = "/"
	}
	
	const signSimpleTransfer = async () => {
		let transfer = await createTransaction("untold.testnet", [transactions.transfer("1000000000000000000000000")])
		wallet?.requestSignTransactions({
			transactions: [transfer]
		})
	}
	
	const signComplicatedTransfer = async () => {
		let transfer = await createTransaction("sub.untold.testnet", [
			transactions.createAccount(),
			transactions.transfer("1000000000000000000000000"),
		])
		wallet?.requestSignTransactions({
			transactions: [transfer]
		})
	}
	
	const signMultipart = async () => {
		let id = "test-" + Date.now() + ".untold.testnet"
		let transfer = await createTransaction(id, [
			transactions.createAccount(),
			transactions.transfer("1000000000000000000000000"),
			transactions.deployContract(new Uint8Array([0]))
		])
		let keypair = KeyPair.fromRandom("ed25519")
		let publicKey = keypair.getPublicKey()
		let accessKey = transactions.fullAccessKey()
		let fc = await createTransaction(id, [
			transactions.functionCall("mint_nft", {argOne: "something", anotherArg: "something else"}, 30000000, 1),
			transactions.deployContract(new Uint8Array([0])),
			transactions.addKey(publicKey, accessKey)
		], 2)
		wallet?.requestSignTransactions({
			transactions: [transfer, fc]
		})
	}
	
	const createTransaction = async (receiverId: string, actions: transactions.Action[], nonceOffset: number = 1): Promise<transactions.Transaction> =>  {
		if (!wallet) {
			throw new Error("no wallet")
		}
		const localKey = await wallet._near.connection.signer.getPublicKey(
			wallet.account().accountId,
			wallet._near.connection.networkId
		)
		const accessKey = await wallet
			.account()
			.accessKeyForTransaction(receiverId, actions, localKey)
		if (!accessKey) {
			throw new Error(`Cannot find matching key for transaction sent to ${receiverId}`)
		}
	
		const block = await wallet._near.connection.provider.block({ finality: 'final' })
		const blockHash = base_decode(block.header.hash)
		const publicKey = PublicKey.from(accessKey.public_key)
		const nonce = accessKey.access_key.nonce + nonceOffset
	
		return transactions.createTransaction(
			wallet.account().accountId,
			publicKey,
			receiverId,
			nonce,
			actions,
			blockHash
		)
	}
	
	useEffect(() => {
		setup()
	}, [])

	return <div>
		{wallet?.getAccountId() && 
			<h1 className="m-4 text-xl font-bold">{ wallet?.getAccountId() }</h1>
		}
		<div>
			<button className="rounded bg-indigo-500 p-2 m-4" onClick={() => signIn()}>Sign In</button>
			<button className="rounded bg-indigo-500 p-2 m-4" onClick={() => signInFullAccess()}>Sign With Full Access</button>
			{ wallet && wallet.isSignedIn() &&
				<button className="rounded bg-indigo-500 p-2 m-4" onClick={() => signOut()}>Sign Out</button>
			}
		</div>
		<div>
			<button className="rounded bg-indigo-500 p-2 m-4" onClick={() => signSimpleTransfer()}>Send Money</button>
			<button className="rounded bg-indigo-500 p-2 m-4" onClick={() => signComplicatedTransfer()}>Sign Multi-action transaction</button>
			<button className="rounded bg-indigo-500 p-2 m-4" onClick={() => signMultipart()}>Sign Multi-action Multi-transaction</button>
		</div>
	</div>
}
export default App
