// src/modelUtils.ts

interface ModelInfo {
  model: string;
  modelName: string;
}

function getModelInfo(
  char: string
): ModelInfo | { isChat: boolean; message: string } {
  const modelEnvVar = `MODEL_${char}`;
  const modelInfo = process.env[modelEnvVar];

  if (modelInfo) {
    const [model, modelName] = modelInfo.split(",");
    return { model, modelName };
  } else {
    return { isChat: false, message: "" };
  }
}

function getAllModels(): ModelInfo[] {
  const models: ModelInfo[] = [];
  for (let i = 0; i <= 9; i++) {
    const modelEnvVar = `MODEL_${i}`;
    const modelInfo = process.env[modelEnvVar];

    if (modelInfo) {
      const [model, modelName] = modelInfo.split(",");
      models.push({ model, modelName });
    }
  }
  return models;
}

export { getModelInfo, getAllModels, ModelInfo };
