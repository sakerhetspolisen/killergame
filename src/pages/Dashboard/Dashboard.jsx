import { useContext, useState, useRef, useEffect } from "react";
import { Redirect } from "react-router-dom";
import {
	Input,
	Button,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	InputGroup,
	Select,
	useToast,
	Grid,
	GridItem,
	Alert,
	AlertIcon,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	TableCaption,
	AlertDialog,
	AlertDialogBody,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogContent,
	AlertDialogOverlay,
} from "@chakra-ui/react";
import AuthContext from "../../contexts/AuthContext";
import { db, functions } from "../../utils/firebase";
import { httpsCallable } from "firebase/functions";
import { ref, get, update, remove } from "firebase/database";
import styles from "./Dashboard.module.css";

/**
 * 
 * WARNING: This is a very early-prototype of the Killergame dashboard, and shouldn't be used in production environments.
 * @author Karl Sellergren
 * 
 * 
 */

export default function Dashboard() {
	const [isAuthenticated] = useContext(AuthContext);
	const [searchInput, setSearchInput] = useState({
		db: "",
		mode: "",
		input: "",
	});
	const [killInput, setKillInput] = useState("");
	const [reviveInput, setReviveInput] = useState("");
	const [emailInput, setEmailInput] = useState({
		mode: "",
		input: "",
	});
	const [searchResults, setSearchResults] = useState(undefined);
	const [unvalidTargets, setUnvalidTargets] = useState("Ingen data");
	const [missingTargets, setMissingTargets] = useState("Ingen data");
	const [notTargetedUsers, setNotTargetedUsers] = useState("Ingen data");
	const [duplicateTargets, setDuplicateTargets] = useState("Ingen data");
	const [duplicateUserIds, setDuplicateUserIds] = useState("Ingen data");
	const [duplicateEmails, setDuplicateEmails] = useState("Ingen data");
	const [showDebugResolveBtn, setShowDebugResolveBtn] = useState(false);
	const [stats, setStats] = useState(null);
	const toast = useToast();
	const [alert, setAlert] = useState({
		show: false,
		title: "",
		desc: "",
		button: "",
		handleClick: null,
	});
	const onClose = () => setAlertIsOpen(false);
	const cancelRef = useRef();

	const sendEmail = (uEmail, uUserId) => {
		const addMessage = httpsCallable(functions, "sendClientSideEmail");
		addMessage({
			email: uEmail,
			userId: uUserId,
		}).then((result) => {
			// Read result of the Cloud Function.
			/** @type {any} */
			const data = result.data;
			const sanitizedMessage = data.text;
			console.log(sanitizedMessage);
		});
	};

	const searchDatabase = async (
		url,
		keyToFilter,
		keyValue,
		nOfMatches,
		returnKey = null
	) => {
		if (
			keyToFilter === "" ||
			keyValue === "" ||
			nOfMatches === "" ||
			nOfMatches === 0 ||
			url === ""
		) {
			toast({
				title: "Hoppsan!",
				description: "Var vänlig fyll i alla fält.",
				status: "error",
				duration: 9000,
				isClosable: true,
			});
			return;
		}
		const dbRef = ref(db, url);
		const data = await get(dbRef).then(
			(image) => {
				if (image.exists()) {
					var matches = [];
					image.forEach((obj) => {
						var keys = obj.val();
						if (keys[keyToFilter] === keyValue) {
							if (matches.length < nOfMatches) {
								matches.push(
									returnKey ? keys[returnKey] : keys
								);
							}
						}
					});
					return matches.length === 0
						? null
						: matches.length === 1
						? matches[0]
						: matches;
				} else {
					return null;
				}
			},
			(error) => {
				toast({
					title: "Error",
					description: error,
					status: "error",
					duration: 9000,
					isClosable: true,
				});
				console.alert(error);
			}
		);
		return data;
	};

	useEffect(() => {
		const getStats = async () => {
			const dbRef = ref(db, "standings");
			const data = await get(dbRef).then(
				(image) => {
					if (image.exists()) {
						let stats = image.val();
						setStats({
							playersLeft: stats.playersLeft,
							playersKilled: stats.playersKilled,
							leftFromGrades: stats.leftFromGrades
						});
					} else {
						return null;
					}
				},
				(error) => {
					toast({
						title: "Error",
						description: error,
						status: "error",
						duration: 9000,
						isClosable: true,
					});
					console.alert(error);
				}
			);
		};
		getStats();
	}, [db]);

	const updateStats = async (grade) => {
		const updates = {};
		updates["/standings/playersLeft"] = await get(
			ref(db, "/standings/playersLeft")
		).then((data) => {
			return data.val() - 1;
		});
		updates["/standings/playersKilled"] = await get(
			ref(db, "/standings/playersKilled")
		).then((data) => {
			return data.val() + 1;
		});
		updates["/standings/leftFromGrades/" + grade] = await get(
			ref(db, "/standings/leftFromGrades/" + grade)
		).then((data) => {
			return data.val() - 1;
		});
		return await update(ref(db), updates);
	};

	const killPlayer = async () => {
		let player = await searchDatabase("users", "userId", killInput, 1);
		if (player) {
			let targetedBy = await searchDatabase(
				"users",
				"targetId",
				player.userId,
				1
			);
			if (targetedBy) {
				let updates = {};
				updates["users/" + targetedBy.userId + "/targetId"] =
					player.targetId;
				updates["killed/" + player.userId] = player;
				console.log(updates);
				update(ref(db), updates).then(() => {
					remove(ref(db, "users/" + player.userId)).then(() => {
						updateStats(player.grade).then(() => {
							toast({
								title: "Användare borttagen",
								description:
									"Reassignade target och uppdaterade statistik",
								status: "success",
								duration: 9000,
								isClosable: true,
							});
						});
					});
				});
			} else {
				toast({
					title: "Fel",
					description:
						"Kunde inte hitta spelaren som har spelaren som target",
					status: "error",
					duration: 9000,
					isClosable: true,
				});
			}
		} else {
			toast({
				title: "Fel",
				description: "Kunde inte hitta användare",
				status: "error",
				duration: 9000,
				isClosable: true,
			});
		}
	};

	const revivePlayer = async () => {
		/**
		 * 1. Get userid of player to revive
		 * 2. Search if player is in killed database
		 * 3. If yes, find a random userId that still plays
		 * 4. Assign that userId to targetId of the player to revive
		 * 5. Find who had the random player as target
		 * 6. Change that players targetId to the revived players userId
		 */

		let player = await searchDatabase("killed", "userId", reviveInput, 1);
		if (player) {
			const dbRef = ref(db, "users");
			let randomPlayer = null;
			let playerWithRandomPlayerAsTarget = null;
			await get(dbRef).then(
				(image) => {
					if (image.exists()) {
						var targetIds = [];
						var userIds = [];
						image.forEach((obj) => {
							var keys = obj.val();
							targetIds.push(keys["targetId"]);
							userIds.push(keys["userId"]);
						});
						randomPlayer =
							userIds[Math.floor(Math.random() * userIds.length)];
						playerWithRandomPlayerAsTarget =
							userIds[targetIds.indexOf(randomPlayer)];
					}
				},
				(error) => {
					toast({
						title: "Error",
						description: error,
						status: "error",
						duration: 9000,
						isClosable: true,
					});
					console.alert(error);
				}
			);
			player.targetId = randomPlayer;
			player.assigned = true;
			let updates = {};
			updates[`users/${player.userId}`] = player;
			updates[`users/${playerWithRandomPlayerAsTarget}/targetId`] =
				player.userId;
			updates[`killed/${player.userId}`] = null;
			updates[`users/${randomPlayer}/assigned`] = true;
			updates["/standings/playersLeft"] = await get(
				ref(db, "/standings/playersLeft")
			).then((data) => {
				return data.val() + 1;
			});
			updates["/standings/playersKilled"] = await get(
				ref(db, "/standings/playersKilled")
			).then((data) => {
				return data.val() - 1;
			});
			updates["/standings/leftFromGrades/" + player.grade] = await get(
				ref(db, "/standings/leftFromGrades/" + player.grade)
			).then((data) => {
				return data.val() + 1;
			});
			console.log(`randomPlayer: ${randomPlayer}`);
			console.log(
				`playerWithRandomPlayerAsTarget: ${playerWithRandomPlayerAsTarget}`
			);
			console.log("Updates to be made:");
			console.log(updates);
			function finalizeRevival(updatesToMake) {
				update(ref(db), updatesToMake).then(() => {
					toast({
						title: "Användare återupplivad",
						description:
							"Ordnade om targets och uppdaterade statistik",
						status: "success",
						duration: 9000,
						isClosable: true,
					});
				});
			}
			setAlert({
				show: true,
				title: `Är du säker på att du vill återuppliva ${player.fname} ${player.lname} med användarnumret ${player.userId}?`,
				desc: "Denna åtgärd går inte att ångra.",
				button: "Återuppliva",
				handleClick: () => finalizeRevival(updates),
			});
		}
	};

	const debugGame = async () => {
		const dbRef = ref(db, "users");
		const data = await get(dbRef).then(
			(image) => {
				if (image.exists()) {
					var targetIds = [];
					var userIds = [];
					var emails = [];
					var playersWithoutTargets = [];
					image.forEach((obj) => {
						var keys = obj.val();
						targetIds.push(keys["targetId"]);
						userIds.push(keys["userId"]);
						emails.push(keys["email"]);
						if (keys["targetId"] === undefined) {
							playersWithoutTargets.push(keys["userId"]);
						}
					});
					console.log(targetIds);
					let difference1 = targetIds.filter(
						(x) => !userIds.includes(x)
					);
					let difference2 = userIds.filter(
						(x) => !targetIds.includes(x)
					);
					let findDuplicates = (arr) =>
						arr.filter((item, index) => arr.indexOf(item) != index);

					// 1. targets not in users - killed targets or missing targets
					// 2. users not in targets - users that arent targeted by anybody
					// 3. duplicates(targets) - users that are targeted by more than one user
					// 4. duplicates(users) - duplicate userIds

					setUnvalidTargets(difference1);
					setNotTargetedUsers(difference2);
					setDuplicateTargets(findDuplicates(targetIds));
					setDuplicateUserIds(findDuplicates(userIds));
					setDuplicateEmails(findDuplicates(emails));
					setMissingTargets(playersWithoutTargets);

					if (playersWithoutTargets.length > 0) {
						setShowDebugResolveBtn(true)
					}
				} else {
					toast({
						title: "Fel",
						description: "Hittade inga användare",
						status: "error",
						duration: 9000,
						isClosable: true,
					});
					return;
				}
			},
			(error) => {
				toast({
					title: "Error",
					description: error,
					status: "error",
					duration: 9000,
					isClosable: true,
				});
				return;
			}
		);
		return data;
	};

	const attemptToResolveProblems = async () => {
		const usersWithMissingTargets = missingTargets
		const usersThatAreNotTargets = [...notTargetedUsers]
		let updates = {};
		for (let user of usersWithMissingTargets) {
			if (usersThatAreNotTargets.length > 0) {
				updates[`users/${user}/targetId`] = usersThatAreNotTargets[0]
			}
		}
		console.log(updates)
	}

	function shuffle(array) {
		let currentIndex = array.length,
			randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [
				array[randomIndex],
				array[currentIndex],
			];
		}

		return array;
	}

	const randomizeTargets = async () => {
		const dbRef = ref(db, "users");
		const data = await get(dbRef).then(
			(image) => {
				if (image.exists()) {
					var userIds = [];
					image.forEach((obj) => {
						var keys = obj.val();
						userIds.push(keys["userId"]);
					});
					console.log(userIds);
					let shuffledUserIds = shuffle(userIds);
					console.log(shuffledUserIds);
					let updates = {};
					let i;
					for (i = 1; i < shuffledUserIds.length; i++) {
						updates["/users/" + shuffledUserIds[i] + "/targetId"] =
							shuffledUserIds[i - 1];
					}
					updates["/users/" + shuffledUserIds[0] + "/targetId"] =
						shuffledUserIds[shuffledUserIds.length - 1];
					update(ref(db), updates).then((res) => {
						toast({
							title: "OK",
							description: "Targets randomized",
							status: "success",
							duration: 9000,
							isClosable: true,
						});
					});
				} else {
					console.log("No data available");
				}
			},
			(error) => {
				toast({
					title: "Fel",
					description: "Kunde inte ansluta till databas",
					status: "error",
					duration: 9000,
					isClosable: true,
				});
			}
		);
		return data;
	};

	const handleClick = async (action) => {
		switch (action) {
			case "search":
				console.log(
					"Searching by",
					searchInput.mode,
					"in",
					searchInput.db,
					"for",
					searchInput.input
				);
				let searchRes = await searchDatabase(
					searchInput.db,
					searchInput.mode,
					searchInput.input,
					11
				);
				if (searchRes) {
					if (searchRes.length > 10) {
						setSearchResults(searchRes.slice(0, 10));
						toast({
							title: "Sökningen gav mer än 10 träffar",
							description: "Försök specificera lite.",
							status: "info",
							duration: 9000,
							isClosable: true,
						});
					} else {
						setSearchResults(searchRes);
					}
				} else {
					toast({
						title: "Inga resultat",
						description: "Försök söka på något annat.",
						status: "error",
						duration: 9000,
						isClosable: true,
					});
				}
				break;
			case "kill":
				setAlert({
					show: true,
					title: `Är du säker på att du vill döda ${killInput}?`,
					desc: "Denna åtgärd går inte att ångra.",
					button: "Döda",
					handleClick: () => killPlayer(),
				});
				break;
			case "revive":
				await revivePlayer();
				break;
			case "debug":
				await debugGame();
				break;
			case "resolveBugs":
				await attemptToResolveProblems();
				break;
			case "email":
				await reAssignTargets(url);
				break;
			case "randomize":
				setAlert({
					show: true,
					title: `Är du säker på att du vill slumpa allas targets?`,
					desc: "Denna åtgärd går inte att ångra.",
					button: "Slumpa",
					handleClick: () => randomizeTargets(),
				});
				break;
			case "pause":
				break;
			case "resume":
				break;
			case "customMessage":
				break;
			default:
		}
	};

	const handleAlertAcceptAndClose = () => {
		setAlert({ ...alert, show: false });
		alert.handleClick();
	};

	if (isAuthenticated === false) return <Redirect to="/" />;
	return (
		<>
			<AlertDialog isOpen={alert.show} leastDestructiveRef={cancelRef}>
				<AlertDialogOverlay>
					<AlertDialogContent background="gray.700">
						<AlertDialogHeader fontSize="lg" fontWeight="bold">
							{alert.title}
						</AlertDialogHeader>

						<AlertDialogBody>{alert.desc}</AlertDialogBody>

						<AlertDialogFooter>
							<Button
								ref={cancelRef}
								onClick={() =>
									setAlert({ ...alert, show: false })
								}
								background="gray.600"
								_hover={{ background: "gray.500" }}
							>
								Avbryt
							</Button>
							<Button
								colorScheme="red"
								onClick={handleAlertAcceptAndClose}
								ml={3}
							>
								{alert.button}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
			<div className={styles.container}>
				<div className={styles.center}>
					<div className={styles.header}>
						<span>Killergame Admin</span>
						<span>Version 0.2.1</span>
					</div>
					<section>
						<Tabs isFitted colorScheme="white">
							<TabList>
								<Tab fontSize="14px">Överblick</Tab>
								<Tab fontSize="14px">Sök</Tab>
								<Tab fontSize="14px">Avlusa</Tab>
								<Tab fontSize="14px">Döda spelare</Tab>
								<Tab fontSize="14px">Återuppliva spelare</Tab>
								<Tab fontSize="14px">Mejla kod</Tab>
								<Tab fontSize="14px">Annat</Tab>
							</TabList>
							<TabPanels background="#202020">
								<TabPanel>
									<h1>
										Välkommen till Killergames adminpanel.
									</h1>
									<Table variant="simple" size="sm">
										<TableCaption>
											Statistik i realtid
										</TableCaption>
										<Thead>
											<Tr>
												<Th
													borderColor="#202020"
													fontWeight="bold"
												>
													Spelare kvar
												</Th>
												<Th
													borderColor="#202020"
													fontWeight="bold"
												>
													Spelare dödade
												</Th>
											</Tr>
										</Thead>
										<Tbody>
											<Tr>
												<Td borderColor="#202020">
													{stats
														? stats.playersLeft
														: ""}
												</Td>
												<Td borderColor="#202020">
													{stats
														? stats.playersKilled
														: ""}
												</Td>
											</Tr>
										</Tbody>
									</Table>
								</TabPanel>
								<TabPanel>
									<h2>Hitta spelare</h2>
									<InputGroup>
										<Select
											placeholder="Välj databas"
											marginRight="3"
											variant="filled"
											background="red.800"
											_hover={{ background: "red.900" }}
											onChange={(e) =>
												setSearchInput({
													...searchInput,
													db: e.target.value,
												})
											}
										>
											<option value="users">
												Spelare
											</option>
											<option value="killed">
												Dödade spelare
											</option>
										</Select>
										<Select
											placeholder="Sök efter"
											marginRight="3"
											variant="filled"
											background="red.800"
											_hover={{ background: "red.900" }}
											onChange={(e) =>
												setSearchInput({
													...searchInput,
													mode: e.target.value,
												})
											}
										>
											<option value="email">
												E-post
											</option>
											<option value="fname">
												Förnamn
											</option>
											<option value="lname">
												Efternamn
											</option>
											<option value="targetId">
												Target ID
											</option>
											<option value="userId">
												User ID
											</option>
										</Select>
										<Input
											placeholder="Sökning"
											variant="filled"
											background="red.800"
											_hover={{ background: "red.600" }}
											color="white"
											value={searchInput.input}
											onInput={(e) =>
												setSearchInput({
													...searchInput,
													input: e.target.value,
												})
											}
										/>
									</InputGroup>
									<Button
										onClick={() => handleClick("search")}
										colorScheme="red"
										isFullWidth={true}
										marginY="5"
									>
										Hitta spelare
									</Button>
									<pre>
										{JSON.stringify(
											searchResults,
											undefined,
											2
										)}
									</pre>
								</TabPanel>
								<TabPanel>
									<h2>Avlusa (hitta fel med) spelet</h2>
									<Button
										isFullWidth
										colorScheme="red"
										marginBottom="5"
										onClick={() => handleClick("debug")}
									>
										Starta avlusning
									</Button>
									<Button
										isFullWidth
										colorScheme="yellow"
										marginBottom="5"
										hidden={!showDebugResolveBtn}
										onClick={() => handleClick("resolveBugs")}
									>
										Trolla bort problemen ✨🧤🎩
									</Button>
									<Grid
										templateRows="repeat(2, 1fr)"
										templateColumns="repeat(2, 1fr)"
										gap={4}
									>
										<GridItem bg="black" padding="2">
											<p>Ogiltiga/döda targets</p>
											<pre>
												{JSON.stringify(
													unvalidTargets,
													undefined,
													2
												)}
											</pre>
										</GridItem>
										<GridItem bg="black" padding="2">
											<p>Spelare som inte är targets</p>
											<pre>
												{JSON.stringify(
													notTargetedUsers,
													undefined,
													2
												)}
											</pre>
										</GridItem>
										<GridItem bg="black" padding="2">
											<p>
												Spelare som mer än 1 person har
												som target
											</p>
											<pre>
												{JSON.stringify(
													duplicateTargets,
													undefined,
													2
												)}
											</pre>
										</GridItem>
										<GridItem bg="black" padding="2">
											<p>Spelare med samma userId</p>
											<pre>
												{JSON.stringify(
													duplicateUserIds,
													undefined,
													2
												)}
											</pre>
										</GridItem>
										<GridItem bg="black" padding="2">
											<p>Konton med identisk e-post</p>
											<pre>
												{JSON.stringify(
													duplicateEmails,
													undefined,
													2
												)}
											</pre>
										</GridItem>
										<GridItem bg="black" padding="2">
											<p>Spelare utan target</p>
											<pre>
												{JSON.stringify(
													missingTargets,
													undefined,
													2
												)}
											</pre>
										</GridItem>
									</Grid>
								</TabPanel>
								<TabPanel>
									<h2>Döda spelare</h2>
									<Input
										placeholder="Användarnummer"
										variant="filled"
										background="red.800"
										_hover={{ background: "red.600" }}
										color="white"
										value={killInput}
										onInput={(e) =>
											setKillInput(e.target.value)
										}
									/>
									<Button
										onClick={() => handleClick("kill")}
										colorScheme="red"
										isFullWidth={true}
										marginY="5"
									>
										Döda
									</Button>
								</TabPanel>
								<TabPanel>
									<h2>Återuppliva spelare</h2>
									<Input
										placeholder="Användarnummer"
										variant="filled"
										background="red.800"
										_hover={{ background: "red.600" }}
										color="white"
										value={reviveInput}
										onInput={(e) =>
											setReviveInput(e.target.value)
										}
									/>
									<Button
										onClick={() => handleClick("revive")}
										colorScheme="red"
										isFullWidth={true}
										marginY="5"
									>
										Återuppliva
									</Button>
								</TabPanel>
								<TabPanel>
									<Alert
										status="info"
										variant="subtle"
										colorScheme="gray.500"
									>
										<AlertIcon />
										Under utveckling!
									</Alert>
									<h2>Mejla userId till spelare</h2>
									<InputGroup>
										<Select
											placeholder="Sök efter"
											marginRight="3"
											variant="filled"
											background="red.800"
											_hover={{ background: "red.900" }}
											onChange={(e) =>
												setEmailInput({
													...emailInput,
													mode: e.target.value,
												})
											}
										>
											<option value="email">
												E-post
											</option>
											<option value="fname">
												Förnamn
											</option>
											<option value="lname">
												Efternamn
											</option>
											<option value="targetId">
												Target ID
											</option>
											<option value="userId">
												User ID
											</option>
										</Select>
										<Input
											placeholder="Sökning"
											variant="filled"
											background="red.800"
											_hover={{ background: "red.600" }}
											color="white"
											value={emailInput.input}
											onInput={(e) =>
												setEmailInput({
													...emailInput,
													input: e.target.value,
												})
											}
										/>
									</InputGroup>
									<Button
										onClick={handleClick}
										colorScheme="red"
										isFullWidth={true}
										marginY="5"
										disabled
									>
										Komponera mejl
									</Button>
									<pre>
										from: test@example.com
										<br />
										to: kase.pch@procivitas.se
										<br />
										<br />
										Hej Karl! <br />
										Här är din kod för Killergame: 123 456
									</pre>
								</TabPanel>
								<TabPanel>
									<Grid
										templateRows="repeat(2, 1fr)"
										templateColumns="repeat(2, 1fr)"
										gap={4}
									>
										<GridItem bg="black" padding="2">
											<Button
												onClick={() =>
													handleClick("randomize")
												}
												colorScheme="red"
												isFullWidth={true}
												marginY="5"
											>
												Slumpa targets för alla spelare
											</Button>
										</GridItem>
										<GridItem bg="black" padding="2">
											<Input
												placeholder="Pausmeddelande"
												marginTop="5"
												marginBottom="3"
												disabled
											/>
											<Button
												onClick={() =>
													handleClick("pause")
												}
												colorScheme="red"
												isFullWidth={true}
												marginBottom="5"
												disabled
											>
												Pausa spelet
											</Button>
										</GridItem>
										<GridItem bg="black" padding="2">
											<Input
												placeholder="Meddelande"
												marginTop="5"
												marginBottom="3"
												disabled
											/>
											<Button
												onClick={() =>
													handleClick("pause")
												}
												colorScheme="red"
												isFullWidth={true}
												marginBottom="5"
												disabled
											>
												Visa meddelande på
												Inloggningssidan
											</Button>
										</GridItem>
										<GridItem
											bg="black"
											padding="2"
										></GridItem>
									</Grid>
								</TabPanel>
							</TabPanels>
						</Tabs>
					</section>
				</div>
			</div>
		</>
	);
}
