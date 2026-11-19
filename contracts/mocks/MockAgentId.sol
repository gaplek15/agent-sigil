// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice Minimal stand-in for the official Agent ID contract, used ONLY
///         for local tests. The real Agent ID contract is
///         0x60b9262456de011f7d15a54cdd8c48baaa8b022f on BNB Chain.
contract MockAgentId is ERC721 {
    uint256 private _nextId;

    constructor() ERC721("Agent ID", "AI") {}

    function mint(address to) external returns (uint256) {
        uint256 id = ++_nextId;
        _safeMint(to, id);
        return id;
    }
}
