# ROSCA Implementation on Vaulta

A ROSCA (Rotating Savings and Credit Association) and personal savings smart contract built for the Vaulta / Antelope network, with a companion web UI for interacting with it.

A ROSCA is the on-chain version of a savings circle: a group of people contribute a fixed amount every cycle, and each cycle one member receives the full pooled payout, until everyone has been paid once. This contract handles that whole lifecycle on-chain — contributions, payout order, stakes, defaults, fees — plus a separate personal savings feature for people who just want to lock funds toward a goal on their own.

Contract account: `roscatesting` (Jungle4 testnet)

---

## Features

### For members / users

- **Join a ROSCA group** — either get added directly by an organizer, or request a seat in an open group and get approved
- **Contribute each cycle** in the group's chosen token
- **Get paid out** on your turn, according to the group's payout order
- **Three payout order modes**:
  - Fixed — payout order set when the group is created
  - Random — order randomized once the group activates
  - Random Commit-Reveal — members commit to a secret hash, then reveal it; the combined revealed values determine the order, so no single party (organizer included) can predetermine or manipulate it
- **Stake** — members post a stake when joining, which is released back gradually as contributions are paid on time, and can be claimed once fully unlocked
- **Personal savings plans** — lock funds toward a goal amount and duration, independent of any group, with optional early ("panic") withdrawal before maturity
- **Reputation** — build an on-chain reputation score by completing savings plans and groups; higher reputation unlocks the ability to organize public (open-seat) groups
- **Early reputation program** — an admin-configurable way to bootstrap reputation for new users before they've completed a full cycle, either for free or by bonding a stake

### For organizers

- **Create a group** — set the token, contribution amount, cycle length, max members, payout order type, and an optional custom fee
- **Manage membership** — accept or decline join requests, or add trusted members directly
- **Mark a member in default** — if a member misses a contribution deadline, cover it out of their own stake
- **Dissolve a group** — with a required reason, if it needs to be wound down
- **Claim organizer fees** — organizers earn a configurable percentage of each cycle's payout for running the group
- **Public groups** — organizers who've hit the reputation thresholds (savings completed / groups organized) can open a group up to join requests instead of hand-picking every member

### Admin / platform controls

- Register and remove supported tokens (with a whitelist for approved token contracts and a blacklist for banned accounts)
- Set platform fees separately for group payouts, personal savings deposits, and organizer cuts, each with a fee-per-transaction or fee-once mode
- Set minimum organizer reputation score and public-group thresholds
- Set withdrawal limits (period, amount, cooldown) to control savings withdrawal pace
- Emergency freeze and pause switches
- Configure and manage the early reputation program

---

## Project structure

```
roscatesting.hpp   - contract interface: tables, actions, constants
roscatesting.cpp   - contract implementation
index.html         - web UI (Wharf/Anchor wallet integration)
```

---

## Setting up / joining

### Requirements

- An Antelope-compatible wallet — [Anchor](https://greymass.com/anchor/) is what the UI is built against
- A funded testnet account on **Jungle4** (get one from a Jungle4 faucet if you don't have one)
- Anchor set up with testnets enabled, and Jungle4 selected as a network

### Using the web UI

1. Open `index.html` (hosted, or run locally with any static file server)
2. Make sure the network switcher is set to **Jungle4 (Testnet)**
3. Click **Connect** and approve the connection in Anchor
4. From there:
   - **Join a group** — browse open groups under Discover, or request to join one directly by group ID
   - **Create a group** — fill in the token, contribution amount, cycle duration, member list (or leave it open for others to request), and payout order type
   - **Start a personal savings plan** — pick a token, goal amount, and duration
   - **Deposit / contribute / claim** — each action sends the matching contract call, signed through Anchor

### Interacting directly (cleos / raw actions)

If you'd rather skip the UI, every feature above maps to a contract action you can push directly, e.g.:

```bash
cleos push action roscatesting creategroup \
  '["youraccount", "4,TOKEN", ["alice","bob"], 2, "10.0000", 604800, 0, 0, false, 0, 0, 0]' \
  -p youraccount@active
```

Check `roscatesting.hpp` for the full action list and argument order — every action is documented there with its parameters.

### Depositing / contributing

Contributions, savings deposits, and stakes all go through a standard token `transfer` to `roscatesting`, with a memo the contract reads to route the funds correctly (e.g. which group or plan it belongs to). The UI builds this transfer for you automatically — you don't need to construct the memo by hand unless you're calling the contract directly.

---

## Notes

- This is deployed and tested on **Jungle4**, a public Antelope/EOS testnet. Don't send anything of real value to it.
- Only tokens registered by an admin via `addtoken` can be used to create groups or savings plans — check the token dropdown in the UI for what's currently supported.
