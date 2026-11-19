// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Agent Sigil — a free, soulbound badge for Agent ID holders
/// @notice One badge per address, mintable only by addresses that hold an
///         Agent ID (SPACE ID Agent ID, ERC-721, BNB Chain). The badge is
///         non-transferable: a proof that means "I am a named agent" is
///         worthless if it can be bought from someone else.
/// @dev No owner, no admin functions, no fees, no upgrade path. The Agent ID
///      contract address is immutable. Metadata (including the SVG artwork)
///      is generated fully on-chain, so the badge survives even if every
///      server around it disappears.
interface IAgentId {
    function balanceOf(address owner) external view returns (uint256);
}

contract AgentSigil is ERC721 {
    using Strings for uint256;

    /// @notice Official Agent ID contract (SPACE ID Agent ID, BNB Chain).
    IAgentId public immutable agentId;

    uint256 private _nextTokenId;
    mapping(address => bool) public hasMinted;
    mapping(address => uint256) public badgeOf;

    error NotAgentIdHolder();
    error AlreadyMinted();
    error Soulbound();
    error ApprovalDisabled();

    event BadgeMinted(address indexed minter, uint256 indexed tokenId);
    event BadgeBurned(address indexed owner, uint256 indexed tokenId);

    constructor(address agentId_) ERC721("Agent Sigil", "SIGIL") {
        agentId = IAgentId(agentId_);
    }

    /// @notice Mint your one free badge. Caller must hold an Agent ID.
    /// @dev No payment: gas only.
    function mint() external {
        if (agentId.balanceOf(msg.sender) == 0) revert NotAgentIdHolder();
        if (hasMinted[msg.sender]) revert AlreadyMinted();
        uint256 tokenId = ++_nextTokenId;
        hasMinted[msg.sender] = true;
        badgeOf[msg.sender] = tokenId;
        _safeMint(msg.sender, tokenId);
        emit BadgeMinted(msg.sender, tokenId);
    }

    /// @notice Burn your badge (renounce it). You may mint again afterwards.
    function burn(uint256 tokenId) external {
        address owner = _ownerOf(tokenId);
        if (owner != msg.sender) revert Soulbound();
        hasMinted[owner] = false;
        badgeOf[owner] = 0;
        _burn(tokenId);
        emit BadgeBurned(owner, tokenId);
    }

    /// @notice True when `account` can mint right now.
    function canMint(address account) external view returns (bool) {
        return !hasMinted[account] && agentId.balanceOf(account) > 0;
    }

    /// @notice True when `account` currently holds a badge.
    function hasBadge(address account) external view returns (bool) {
        return hasMinted[account];
    }

    /// @notice Total badges ever minted.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // ---- Soulbound: no transfers, no approvals -------------------------

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert ApprovalDisabled();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert ApprovalDisabled();
    }

    // ---- On-chain metadata ---------------------------------------------

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        string memory svg = _svg(tokenId);
        string memory json = string(
            abi.encodePacked(
                '{"name":"Agent Sigil #',
                tokenId.toString(),
                '","description":"A wax-seal badge proving its bearer holds an Agent ID (name.ai). Free, soulbound, and verifiable on-chain: one address, one seal, never for sale.","image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '","attributes":[{"trait_type":"Agent ID Holder","value":"Yes"},{"trait_type":"Soulbound","value":"Yes"},{"trait_type":"Token ID","value":',
                tokenId.toString(),
                "}]}"
            )
        );
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    function _svg(uint256 tokenId) internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">',
                    '<rect width="512" height="512" fill="#0f1026"/>',
                    '<circle cx="256" cy="256" r="200" fill="none" stroke="#d4af37" stroke-width="6"/>',
                    '<circle cx="256" cy="256" r="176" fill="none" stroke="#d4af37" stroke-width="2"/>',
                    '<circle cx="256" cy="256" r="150" fill="#1a1c3f" stroke="#2dd4bf" stroke-width="2"/>',
                    '<polygon points="256,128 366,320 146,320" fill="none" stroke="#d4af37" stroke-width="5" stroke-linejoin="round"/>',
                    '<polygon points="256,384 366,192 146,192" fill="none" stroke="#d4af37" stroke-width="5" stroke-linejoin="round"/>',
                    '<circle cx="256" cy="256" r="34" fill="#d4af37"/>',
                    '<text x="256" y="118" font-family="serif" font-size="30" fill="#d4af37" text-anchor="middle" letter-spacing="6">AGENT</text>',
                    '<text x="256" y="416" font-family="serif" font-size="30" fill="#d4af37" text-anchor="middle" letter-spacing="6">SIGIL</text>',
                    '<text x="256" y="452" font-family="monospace" font-size="20" fill="#2dd4bf" text-anchor="middle">#',
                    tokenId.toString(),
                    "</text>",
                    '<text x="256" y="52" font-family="monospace" font-size="15" fill="#8b8db0" text-anchor="middle">SOULBOUND &#183; NAME.AI</text>',
                    "</svg>"
                )
            );
    }
}
