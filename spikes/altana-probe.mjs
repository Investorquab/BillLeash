try {
  const sdk = await import("@altananetwork/sdk");
  console.log("import OK. exports:", Object.keys(sdk).join(", "));
} catch (e) {
  console.log("import FAILED:", String(e.message).split("\n")[0]);
}
