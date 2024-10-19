'use client';

import { useState } from 'react'
import { Transaction } from '@mysten/sui/transactions';
import { useSignTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

const Test = () => {
    const PACKAGE_ID = '0x993f1f7eee655c9c8bf383d3cfc155541a464149d531c9066853ac1ad1549126';
    const REGISTRY_ID = '0xcb2f1a519d9e2b8b3ff64a68803931143de2425b8ba3afd4726cd8de33eb8dab';

    const { mutateAsync: signTransaction } = useSignTransaction();
    const [signature, setSignature] = useState('');
    const [creatorSubscriptionId, setCreatorSubscriptionId] = useState<string | null>(null);
    const client = useSuiClient()
    const account = useCurrentAccount()

    return (
        <div>
        {account && (
            <>
                <div>
                    <button
                        onClick={async () => {

                            const tx = new Transaction();

                            const [creatorSubscription] = tx.moveCall({
                                target: `${PACKAGE_ID}::subscription::initialize`,
                                arguments: [
                                    tx.object(REGISTRY_ID),
                                    tx.pure.u64(100), 
                                    tx.pure.u64(30 * 24 * 60 * 60 * 1000)
                                ],
                            });

                            // setCreatorSubscriptionId(creatorSubscription.NestedResult.)

                            const { bytes, signature, reportTransactionEffects } = await signTransaction({
                                transaction: tx,
                                chain: 'sui:testnet'
                            })
                            
                            setSignature(signature)

                            const executeResult = await client.executeTransactionBlock({
                                transactionBlock: bytes,
                                signature,
                                options: {
                                    showRawEffects: true,
                                    showObjectChanges: true
                                },
                            });

                            const createdObject = executeResult.objectChanges?.find((obj) => obj.type == 'created')
                            if (createdObject) setCreatorSubscriptionId(createdObject.objectId)

                            // Always report transaction effects to the wallet after execution
                            reportTransactionEffects(executeResult.rawEffects!);

                            console.log(executeResult);
                        }}
                    >
                        create sub
                    </button>
                    <button
                        onClick={async () => {

                            if (creatorSubscriptionId == null) return
                            const tx = new Transaction();

                            tx.moveCall({
                                target: `${PACKAGE_ID}::subscription::subscribe`,
                                arguments: [
                                    tx.object(creatorSubscriptionId),
                                    tx.object('0x6'),
                                ]
                            })
                            const { bytes, signature, reportTransactionEffects } = await signTransaction({
                                transaction: tx,
                                chain: 'sui:testnet'
                            })

                            setSignature(signature)

                            const executeResult = await client.executeTransactionBlock({
                                transactionBlock: bytes,
                                signature,
                                options: {
                                    showRawEffects: true,
                                },
                            });

                            // Always report transaction effects to the wallet after execution
                            reportTransactionEffects(executeResult.rawEffects!);

                            console.log(executeResult);
                        }}
                    >
                        sub
                    </button>
                </div>
                <div>Signature: {signature}</div>
            </>
        )}
        </div>
    )
};

export default Test;
