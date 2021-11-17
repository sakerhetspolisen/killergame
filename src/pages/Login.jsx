import React, { useState } from "react";
import styles from "./Login.module.css";
import {
	Input,
	Button,
	FormControl,
	FormLabel,
	InputGroup,
	Popover,
	PopoverTrigger,
	PopoverContent,
	PopoverHeader,
	PopoverBody,
	PopoverArrow,
	PopoverCloseButton,
	Alert,
	AlertIcon,
	AlertTitle,
	AlertDescription,
	CloseButton
} from "@chakra-ui/react";
import { ref, get, update, remove } from "firebase/database";
import dbSearch from "../utils/dbSearch";
import InputMask from "react-input-mask";
import { GiBloodySword } from "react-icons/gi";

/**
 * Login Page that enables user to see and kill targets.
 * @author Karl Sellergren
 * 
 * 
 * @param db reference to the database
 * @param setUser function to update parent user State
 */

const Login = ({ db, setUser }) => {
	const [inputUserId, setInputUserId] = useState("");
	const [alert, setAlert] = useState({
		visible: true,
		status: "error",
		title: "Killergame är slut.",
		desc: "Ses 2022!"
	})
	const [loggedInUser, setLoggedInUser] = useState(null);
	const [targetFName, setTargetFName] = useState("");
	const [targetLName, setTargetLName] = useState("");
	const [targetGrade, setTargetGrade] = useState("");
	const [kills, setKills] = useState(null);
	const [showKilledBanner, setShowKilledBanner] = useState(false);
	const [targetId, setTargetId] = useState("");
	const [inputTargetId, setInputTargetId] = useState("");

	const secondsToReadable = (d) => {
		if (d && (typeof d === "number" || typeof d === "string")) {
			d = Number(d);
			var h = Math.floor(d / 3600);
			var m = Math.floor((d % 3600) / 60);
			var s = Math.floor((d % 3600) % 60);

			var hDisplay = h > 0 ? h + (h === 1 ? "h " : "h ") : "";
			var mDisplay = m > 0 ? m + (m === 1 ? "min " : "min ") : "";
			var sDisplay = s > 0 ? s + (s === 1 ? "s" : "s") : "";
			return hDisplay + mDisplay + sDisplay;
		} else {
			return ""
		}
	};

	const attemptLoginUser = async () => {
		const userObj = await dbSearch(
			"users",
			"userId",
			inputUserId.replace(" ", ""),
			1
		);
		if (userObj) {
			const userTarget = await dbSearch(
				"users",
				"userId",
				userObj.targetId,
				1
			);
			setTargetGrade(userTarget.grade);
			setTargetFName(userTarget.fname);
			setTargetLName(userTarget.lname);
			setTargetId(userTarget.userId);
			setKills(userObj.kills);
			setUser(userObj);
			setLoggedInUser(userObj);
			localStorage.setItem("userId", userObj.userId.replace(" ", ""));
		} else {
			setAlert({
				visible: true,
				status: "error",
				title: "Användaren existerar inte.",
				desc: ""
			})
		}
	};

	const updateStats = async (grade) => {
		const updates = {};
		updates["/standings/playersLeft"] = await get(ref(db, "/standings/playersLeft")).then((data) => {return data.val() - 1});
		updates["/standings/playersKilled"] = await get(ref(db, "/standings/playersKilled")).then((data) => {return data.val() + 1});
		updates["/standings/leftFromGrades/" + grade] = await get(ref(db, "/standings/leftFromGrades/" + grade)).then((data) => {return Number(data.val()) - 1});
		return await update(ref(db), updates)
	}

	const killPlayer = async (id) => {
		const targetObj = await dbSearch("users", "userId", id, 1);
		const updates = {};
		updates["/killed/" + id] = targetObj;
		update(ref(db), updates).then(() => {
			remove(ref(db, "users/" + id)).then(() => {
				console.log("User removed");
			});
		});
	};

	const updateLoggedInUserData = async (userObj) => {
		const newTargetId = await dbSearch(
			"users",
			"userId",
			userObj.targetId,
			1,
			"targetId"
		);
		const newTargetObj = await dbSearch("users", "userId", newTargetId, 1);
		const newKills = userObj.kills + 1;
		const millisNow = Date.now();
		const millisThen = Number(userObj.latestTime)
		const killTime = (millisNow - millisThen) / 1000;
		const fastestKill = (userObj.fastestKill === "") ? killTime : (killTime < userObj.fastestKill) ? killTime : userObj.fastestKill
		const updates = {};
		updates["/users/" + userObj.userId + "/targetId"] = newTargetId;
		updates["/users/" + userObj.userId + "/kills"] = newKills;
		updates["/users/" + userObj.userId + "/latestTime"] = millis;
		updates["/users/" + userObj.userId + "/fastestKill"] = fastestKill;
		await update(ref(db), updates).then(() => {
			setTargetFName(newTargetObj.fname);
			setTargetLName(newTargetObj.lname);
			setTargetGrade(newTargetObj.grade);
			setTargetId(newTargetObj.userId);
			setKills(newKills);
		});
	};

	const validateKill = () => {
		if (inputTargetId.replace(" ", "") === targetId) {
			setShowKilledBanner(true);
			updateLoggedInUserData(loggedInUser);
			updateStats(targetGrade);
			killPlayer(targetId);
			setTimeout(() => setShowKilledBanner(false), 2000);
		} else {
			setAlert({
				visible: true,
				status: "error",
				title: "Fel användarnummer.",
				desc: "Inte bra."
			})
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		validateKill();
	};

	const handleLogin = (e) => {
		e.preventDefault();
		if (inputUserId.replace(" ","").length === 6) {
			attemptLoginUser()
		} else {
			setAlert({
				visible: true,
				status: "error",
				title: "Numret har fel format.",
				desc: ""
			})
		}
	};

	return (
		<>
			<div
				className={styles.killed}
				style={{ display: showKilledBanner ? "flex" : "none" }}
			>
				<span>Dödad!</span>
			</div>
			<div className={styles.hero}>
				<div style={{ margin: "auto" }}>
					<Alert status={alert.status} display={alert.visible ? "flex" : "none"} colorScheme={(alert.status === "error" ? "red.500" : "green.500")} marginBottom="5">
						<AlertIcon />
						<AlertTitle mr={2}>{alert.title}</AlertTitle>
						<AlertDescription>{alert.desc}</AlertDescription>
						<CloseButton position="absolute" right="8px" top="8px" onClick={() => setAlert({...alert, visible: false})} />
					</Alert>
					{loggedInUser ? (
						<div className={styles.loggedIn}>
							<div className={styles.loggedInHeader}>
								<span>
									Inloggad som{" "}
									<b>
										{loggedInUser.fname
											? loggedInUser.fname
											: "dödaren"}
									</b>
									.
								</span>
								{loggedInUser.kills > 0 ? (
									<span>
										Kills: <b>{loggedInUser.kills}</b>{" "}
										spelare
									</span>
								) : null}
							</div>
							<h2
								style={{
									textAlign: "center",
									fontFamily: "Helvetica, sans-serif",
									fontSize: "1.5em",
								}}
							>
								Din nästa target är:
							</h2>
							<div className={styles.ticket}>
								<div className={styles.ticketBody}>
									<span>
										<b>
											{targetFName} {targetLName}
										</b>
									</span>
									<GiBloodySword size="2em" />
									<span style={{ fontSize: "1.5em" }}>
										<b>{targetGrade}</b>
									</span>
								</div>
							</div>
							<div className={styles.killForm}>
								<InputGroup>
									<FormControl id="number" marginRight="5">
										<Input
											as={InputMask}
											mask="999 999"
											maskChar={null}
											focusBorderColor="black.100"
											background="black.100"
											size="lg"
											fontWeight="bold"
											borderWidth="0"
											placeholder="123 456"
											borderRadius="0"
											color="black"
											value={inputTargetId}
											onInput={(e) =>
												setInputTargetId(e.target.value)
											}
										/>
									</FormControl>
									<Button
										colorScheme="red"
										isFullWidth={true}
										borderRadius="0"
										padding="6"
										onClick={handleSubmit}
									>
										Döda spelare
									</Button>
								</InputGroup>
								<Popover>
									<PopoverTrigger>
										<Button
											variant="unstyled"
											isFullWidth={true}
											marginTop="5"
											borderRadius="0"
											size="sm"
											fontWeight="thin"
										>
											Var hittar jag min targets kod?
										</Button>
									</PopoverTrigger>
									<PopoverContent>
										<PopoverArrow />
										<PopoverCloseButton color="black" />
										<PopoverHeader
											color="black"
											fontWeight="bold"
										>
											Var är koden till min target?
										</PopoverHeader>
										<PopoverBody color="black">
											När du dödat din target och spelaren inte vet sin kod ber du spelaren ta upp det mejlet som spelaren fick vid registrering.
										</PopoverBody>
									</PopoverContent>
								</Popover>
							</div>
							<div className={styles.stats}>
								<table
									style={{
										fontSize: "0.8em",
										marginTop: "2em",
									}}
								>
									<tbody>
										<tr>
											<th>Dina användardata</th>
											<th></th>
										</tr>
										<tr>
											<td>Snabbaste kill:</td>
											<td>{secondsToReadable(loggedInUser.fastestKill)}</td>
										</tr>
										<tr>
											<td>Kills</td>
											<td>{kills}</td>
										</tr>
										<tr>
											<td>Användarnummer</td>
											<td>{loggedInUser.userId}</td>
										</tr>
										<tr>
											<td>Skolmejl</td>
											<td>{loggedInUser.email}</td>
										</tr>
										<tr>
											<td>Klass</td>
											<td>{loggedInUser.grade}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					) : (
						<>
							<h1
								style={{ textAlign: "center", fontSize: "2em" }}
							>
								Se vem du ska döda
							</h1>
							<FormControl id="number" marginTop="4">
								<FormLabel>Användarnummer</FormLabel>
								<Input
									as={InputMask}
									mask="999 999"
									maskChar={null}
									focusBorderColor="red.500"
									background="red.900"
									size="lg"
									fontWeight="bold"
									borderWidth="3px"
									placeholder="123 456"
									borderRadius="0"
									value={inputUserId}
									disabled
								/>
							</FormControl>
							<Button
								colorScheme="red"
								isFullWidth={true}
								borderRadius="0"
								marginTop="5"
								disabled
							>
								Logga in
							</Button>
							<Popover>
								<PopoverTrigger>
									<Button
										variant="unstyled"
										isFullWidth={true}
										marginTop="5"
										borderRadius="0"
										size="sm"
										fontWeight="thin"
									>
										Var hittar jag min kod?
									</Button>
								</PopoverTrigger>
								<PopoverContent>
									<PopoverArrow />
									<PopoverCloseButton color="black" />
									<PopoverHeader
										color="black"
										fontWeight="bold"
									>
										Var finns koden? &#x1F914;
									</PopoverHeader>
									<PopoverBody color="black">
										När du anmälde dig skickades det ett
										mejl till den e-postadressen du angav.
									</PopoverBody>
								</PopoverContent>
							</Popover>
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default Login;
