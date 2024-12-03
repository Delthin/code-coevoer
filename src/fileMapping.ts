interface CodeTestMapping {
    productionFilePath: string;
    testFilePath: string;
    diff: string;
}

export type FileMapping = CodeTestMapping[];