import React, { useEffect, useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { db } from "../utils/firebase";
import { ref, get } from "firebase/database";
import { FaCrown } from "react-icons/fa";
import { RiKnifeBloodFill } from "react-icons/ri";
import data from "../assets/results2021.json";

/**
 * Example from last year, Statistics about the game
 *
 */

const TableElement = ({ i, name, kills, grade }) => {
	return (
		<Tr
			background={
				i == 0 ? "yellow.500" : i == 1 ? "gray.500" : "gray.700"
			}
		>
			<Td whiteSpace="nowrap" borderColor="black">
				<div style={{ display: "flex" }}>
					{i == 0 ? (
						<FaCrown color="#9c7500" />
					) : i == 1 ? (
						<RiKnifeBloodFill color="#202020" />
					) : null}{" "}
					{name}
				</div>
			</Td>
			<Td isNumeric borderColor="black">
				{kills}
			</Td>
			<Td borderColor="black">{grade}</Td>
		</Tr>
	);
};

const Statistics = ({ db }) => {
	const [generalStats, setGeneralStats] = useState(data.results);

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
			}}
		>
			<div>
				<h1
					style={{
						textAlign: "center",
						fontSize: "1.4em",
						marginBottom: "1em",
					}}
				>
					Resultat 2021
				</h1>
				<Table variant="simple" size="sm" borderColor="black">
					<Thead>
						<Tr>
							<Th>Namn</Th>
							<Th isNumeric>Kills</Th>
							<Th>Klass</Th>
						</Tr>
					</Thead>
					<Tbody>
						{generalStats ? (
							generalStats.map((user, index) => (
								<TableElement
									i={index}
									name={user.name}
									kills={user.kills}
									grade={user.grade}
								/>
							))
						) : (
							<Tr>
								<Td>Laddar...</Td>
							</Tr>
						)}
					</Tbody>
				</Table>
				<p style={{ textAlign: "center", paddingTop: 20, display: "block" }}>
					Totalt antal spelare: 226
				</p>
			</div>
		</div>
	);
};

export default Statistics;
