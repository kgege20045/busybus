export async function getSeatPrediction(routeid: number, selectTime: number) {
  const url = `http://<YOUR_BACKEND_URL>/predict_seat?routeid=${routeid}&select_time=${selectTime}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Prediction API error");

  return await response.json();
}
