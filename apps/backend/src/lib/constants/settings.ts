class Settings {
    averageExecutionTime: number;
    totalApiHits: number;

    constructor() {
        this.averageExecutionTime = 0;
        this.totalApiHits = 0;
    }

    setAverageExecutionTime(time: number) {
        this.averageExecutionTime = time;
    }

    getAverageExecutionTime() {
        return this.averageExecutionTime;
    }

    logExecutionTime(executionTime: number) {
        const averageExecution = (this.averageExecutionTime * this.totalApiHits + executionTime) / (this.totalApiHits + 1);
        this.totalApiHits++;
        console.log(`Average execution time: ${averageExecution} ms`);
        console.log(`Execution time: ${executionTime} ms`);
        this.setAverageExecutionTime(averageExecution);
    }
}

export const settings = new Settings();