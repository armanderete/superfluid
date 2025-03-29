"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import gdav1forwarderABI from '../../../abi/gdav1forwarderABI.json'; // adjust the path as needed

function PoolInteractionManager() {
  const [poolAddress, setPoolAddress] = useState('');
  const [memberAddress, setMemberAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState('');

  // Superfluid's GDAv1Forwarder address (same on all chains)
  const forwarderAddress = '0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08';

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        setAccount(addr);
        setWalletConnected(true);
        setMessage(`Connected to ${addr}`);
        window.alert(`Connected to ${addr}`);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setMessage('Failed to connect wallet. Please try again.');
        window.alert('Failed to connect wallet. Please try again.');
      }
    } else {
      setMessage('Please install Metamask to use this feature.');
      window.alert('Please install Metamask to use this feature.');
    }
  };

  /**
   * performAction handles three actions:
   * - 'connect': Connect a member to the pool.
   *   If a memberAddress is provided, it is encoded into userData;
   *   otherwise, the connected account is used.
   * - 'disconnect': Disconnect from the pool.
   * - 'claim': Claim all tokens from the pool for the given member (or the connected wallet).
   */
  const performAction = async (action: 'connect' | 'disconnect' | 'claim') => {
    if (!walletConnected) {
      window.alert('Please connect your wallet first.');
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(forwarderAddress, gdav1forwarderABI, signer);
      let tx;
      switch (action) {
        case 'connect':
          // If a memberAddress is provided, use it; otherwise, default to the connected account.
          const targetAddress = memberAddress || account;
          // Encode the target address into userData
          const userData = ethers.utils.defaultAbiCoder.encode(["address"], [targetAddress]);
          tx = await contract.connectPool(poolAddress, userData);
          break;
        case 'disconnect':
          tx = await contract.disconnectPool(poolAddress, "0x");
          break;
        case 'claim':
          tx = await contract.claimAll(poolAddress, memberAddress || account, "0x");
          break;
      }
      await tx.wait();
      window.alert(`Successfully ${action === 'claim' ? 'claimed from' : action + 'ed to'} pool`);
      setMessage(`Successfully ${action === 'claim' ? 'claimed from' : action + 'ed to'} pool`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      window.alert(`Failed to ${action} pool. Please try again.`);
      setMessage(`Failed to ${action} pool. Please try again.`);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>
        Pool Interaction Manager
      </h1>
      
      {!walletConnected ? (
        <button
          onClick={connectWallet}
          style={{
            backgroundColor: 'blue',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '10px'
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <p>Connected: {account}</p>
      )}
      
      <input
        placeholder="Pool Address"
        value={poolAddress}
        onChange={(e) => setPoolAddress(e.target.value)}
        style={{ width: '100%', padding: '10px', margin: '10px 0' }}
      />
      <input
        placeholder="Member Address (optional for connecting/claiming)"
        value={memberAddress}
        onChange={(e) => setMemberAddress(e.target.value)}
        style={{ width: '100%', padding: '10px', margin: '10px 0' }}
      />
      <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
        <button
          onClick={() => performAction('connect')}
          style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Connect to Pool
        </button>
        <button
          onClick={() => performAction('disconnect')}
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Disconnect from Pool
        </button>
      </div>
      <button
        onClick={() => performAction('claim')}
        style={{
          backgroundColor: 'blue',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          border: 'none',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Claim All Tokens
      </button>
      
      {message && <p style={{ marginTop: '20px', textAlign: 'center' }}>{message}</p>}
    </div>
  );
}

export default PoolInteractionManager;
