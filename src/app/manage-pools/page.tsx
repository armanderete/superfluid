"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import gdav1forwarderABI from '../../../abi/gdav1forwarderABI.json'; // adjust the path as needed

// Define an interface for the PoolCreated event
interface PoolCreatedEvent {
  event: string;
  args: any[]; // Replace with more specific types if available
}

function DistributionPoolManager() {
  // General states
  const [tokenAddress, setTokenAddress] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [poolAddress, setPoolAddress] = useState('');
  const [memberAddress, setMemberAddress] = useState('');
  const [claimWalletAddress, setClaimWalletAddress] = useState('');
  const [newUnits, setNewUnits] = useState('');
  const [distributionAmount, setDistributionAmount] = useState('');
  const [flowRateValue, setFlowRateValue] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState('');

  // New states for manual flow distribution
  const [flowTokenAddress, setFlowTokenAddress] = useState('');
  const [flowFromAddress, setFlowFromAddress] = useState('');
  const [flowPoolAddress, setFlowPoolAddress] = useState('');
  const [flowRequestedRate, setFlowRequestedRate] = useState('');
  const [flowUserData, setFlowUserData] = useState('0x');

  // Superfluid's GDAv1Forwarder address (same on all chains)
  const forwarderAddress = '0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08';

  // Basic validation function: Checks if an address string is non-empty and looks valid (starts with "0x")
  const isValidAddress = (address: string) =>
    address && address.startsWith("0x") && address.length === 42;

  // Connect Wallet function
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

  // Create a new distribution pool with manual gas estimation
  const createPool = async () => {
    if (!walletConnected) {
      window.alert('Please connect your wallet first.');
      return;
    }
    if (!isValidAddress(tokenAddress)) {
      window.alert("Please enter a valid Token Address.");
      return;
    }
    if (!isValidAddress(adminAddress)) {
      window.alert("Please enter a valid Admin Address.");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const forwarderContract = new ethers.Contract(forwarderAddress, gdav1forwarderABI, signer);

      const config = {
        transferabilityForUnitsOwner: false,
        distributionFromAnyAddress: true,
      };

      const estimatedGas = await forwarderContract.estimateGas.createPool(tokenAddress, adminAddress, config);
      const gasLimit = estimatedGas.mul(120).div(100);
      const gasPrice = await provider.getGasPrice();

      const tx = await forwarderContract.createPool(
        tokenAddress,
        adminAddress,
        config,
        { gasLimit, gasPrice }
      );
      const receipt = await tx.wait();

      const poolCreatedEvent = receipt.events.find((e: PoolCreatedEvent) => e.event === 'PoolCreated');
      if (poolCreatedEvent) {
        const [, createdPoolAddress] = poolCreatedEvent.args;
        setPoolAddress(createdPoolAddress);
        setMessage(`Pool created successfully at ${createdPoolAddress}`);
        window.alert(`Pool created successfully at ${createdPoolAddress}`);
      } else {
        setMessage('Pool creation event not found.');
        window.alert('Pool creation event not found.');
      }
    } catch (error) {
      console.error('Error creating pool:', error);
      setMessage('Failed to create pool. Please try again.');
      window.alert('Failed to create pool. Please try again.');
    }
  };

  // Update member units in the distribution pool
  const updateMemberUnits = async () => {
    if (!walletConnected) {
      window.alert('Please connect your wallet first.');
      return;
    }
    if (!isValidAddress(poolAddress)) {
      window.alert("Please enter a valid Pool Address.");
      return;
    }
    if (!isValidAddress(memberAddress)) {
      window.alert("Please enter a valid Member Address.");
      return;
    }
    if (!newUnits) {
      window.alert("Please enter the new units value.");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const forwarderContract = new ethers.Contract(forwarderAddress, gdav1forwarderABI, signer);
      const tx = await forwarderContract.updateMemberUnits(poolAddress, memberAddress, newUnits, "0x");
      await tx.wait();
      setMessage('Member units updated successfully!');
      window.alert('Member units updated successfully!');
    } catch (error) {
      console.error('Error updating member units:', error);
      setMessage('Failed to update member units. Please try again.');
      window.alert('Failed to update member units. Please try again.');
    }
  };

  // Instant distribution of tokens to pool members proportional to their current units
  const distributeTokens = async () => {
    if (!walletConnected) {
      window.alert('Please connect your wallet first.');
      return;
    }
    if (!isValidAddress(tokenAddress)) {
      window.alert("Please enter a valid Token Address.");
      return;
    }
    if (!isValidAddress(poolAddress)) {
      window.alert("Please enter a valid Pool Address.");
      return;
    }
    if (!distributionAmount) {
      window.alert("Please enter a distribution amount.");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const forwarderContract = new ethers.Contract(forwarderAddress, gdav1forwarderABI, signer);
      const amountBN = ethers.utils.parseUnits(distributionAmount, 18);
      const tx = await forwarderContract.distribute(tokenAddress, account, poolAddress, amountBN, "0x");
      await tx.wait();
      setMessage('Tokens distributed successfully!');
      window.alert('Tokens distributed successfully!');
    } catch (error) {
      console.error('Error distributing tokens:', error);
      setMessage('Failed to distribute tokens. Please try again.');
      window.alert('Failed to distribute tokens. Please try again.');
    }
  };

  // Flow distribution of tokens to pool members proportional to their current units using manual inputs
  const manualDistributeFlowTokens = async () => {
    if (!walletConnected) {
      window.alert('Please connect your wallet first.');
      return;
    }
    if (!isValidAddress(flowTokenAddress)) {
      window.alert("Please enter a valid Flow Token Address.");
      return;
    }
    if (!isValidAddress(flowFromAddress)) {
      window.alert("Please enter a valid From Address for flow distribution.");
      return;
    }
    if (!isValidAddress(flowPoolAddress)) {
      window.alert("Please enter a valid Pool Address for flow distribution.");
      return;
    }
    if (!flowRequestedRate) {
      window.alert("Please enter a flow rate value.");
      return;
    }
    // userData is optional; we already have a default
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const forwarderContract = new ethers.Contract(forwarderAddress, gdav1forwarderABI, signer);
      const requestedFlowRate = parseInt(flowRequestedRate);
      const tx = await forwarderContract.distributeFlow(
        flowTokenAddress,
        flowFromAddress,
        flowPoolAddress,
        requestedFlowRate,
        flowUserData
      );
      await tx.wait();
      setMessage('Manual flow distribution updated successfully!');
      window.alert('Manual flow distribution updated successfully!');
    } catch (error) {
      console.error('Error updating manual flow distribution:', error);
      setMessage('Failed to update manual flow distribution. Please try again.');
      window.alert('Failed to update manual flow distribution. Please try again.');
    }
  };

  // Function to perform connect, disconnect, and claim actions.
  // Modified claim: uses the manually entered claimWalletAddress to claim tokens on behalf of a user.
  const performAction = async (action: 'connect' | 'disconnect' | 'claim') => {
    if (!walletConnected) {
      window.alert('Please connect your wallet first.');
      return;
    }
    if (!isValidAddress(poolAddress)) {
      window.alert("Please enter a valid Pool Address.");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(forwarderAddress, gdav1forwarderABI, signer);
      let tx;
      switch (action) {
        case 'connect': {
          const targetAddress = memberAddress || account;
          const userData = ethers.utils.defaultAbiCoder.encode(["address"], [targetAddress]);
          tx = await contract.connectPool(poolAddress, userData);
          break;
        }
        case 'disconnect':
          tx = await contract.disconnectPool(poolAddress, "0x");
          break;
        case 'claim':
          if (!claimWalletAddress || !isValidAddress(claimWalletAddress)) {
            window.alert("Please enter a valid wallet address to claim on behalf of.");
            return;
          }
          tx = await contract.claimAll(poolAddress, claimWalletAddress, "0x");
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
        Distribution Pool Manager
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
      
      {/* Create Pool Section */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Create Pool</h2>
        <input
          placeholder="Token Address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          placeholder="Admin Address"
          value={adminAddress}
          onChange={(e) => setAdminAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <button
          onClick={createPool}
          style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Create Pool
        </button>
      </div>
      
      {/* Update Member Units Section */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Update Member Units</h2>
        <input
          placeholder="Pool Address"
          value={poolAddress}
          onChange={(e) => setPoolAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          placeholder="Member Address"
          value={memberAddress}
          onChange={(e) => setMemberAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          placeholder="New Units"
          value={newUnits}
          onChange={(e) => setNewUnits(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <button
          onClick={updateMemberUnits}
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
          Update Member Units
        </button>
      </div>
      
      {/* Distribution Functions Section */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Distribute Tokens</h2>
        <input
          placeholder="Distribution Amount (in tokens)"
          value={distributionAmount}
          onChange={(e) => setDistributionAmount(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <button
          onClick={distributeTokens}
          style={{
            backgroundColor: 'purple',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Distribute Tokens
        </button>
      </div>

      {/* Manual Flow Distribution Section */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Manual Flow Distribution</h2>
        <input
          placeholder="Flow Token Address"
          value={flowTokenAddress}
          onChange={(e) => setFlowTokenAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          placeholder="From Address"
          value={flowFromAddress}
          onChange={(e) => setFlowFromAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          placeholder="Pool Address"
          value={flowPoolAddress}
          onChange={(e) => setFlowPoolAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          placeholder="Requested Flow Rate (int96)"
          value={flowRequestedRate}
          onChange={(e) => setFlowRequestedRate(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          placeholder="User Data (bytes, default 0x)"
          value={flowUserData}
          onChange={(e) => setFlowUserData(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <button
          onClick={manualDistributeFlowTokens}
          style={{
            backgroundColor: 'orange',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Manual Distribute Flow
        </button>
      </div>
      
      {/* Connect/Disconnect/Claim Section */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Pool Interaction</h2>
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
        <div style={{ marginBottom: '10px' }}>
          <input
            placeholder="Claim Wallet Address"
            value={claimWalletAddress}
            onChange={(e) => setClaimWalletAddress(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '10px 0' }}
          />
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
      </div>
      
      {message && <p style={{ marginTop: '20px', textAlign: 'center' }}>{message}</p>}
    </div>
  );
}

export default DistributionPoolManager;
