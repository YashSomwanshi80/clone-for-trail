import asyncio
import uuid

from schemas import JobStatus


class JobManager:
    """In-memory job tracking for /infer/video background processing.
    Per SRS Section 3: transient, not persisted beyond job lifetime — no DB."""

    def __init__(self):
        self._jobs: dict[str, JobStatus] = {}
        self._lock = asyncio.Lock()

    def create_job(self) -> str:
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = JobStatus(status="PROCESSING", detectionsCount=0)
        return job_id

    async def update(self, job_id: str, **kwargs):
        async with self._lock:
            if job_id in self._jobs:
                current = self._jobs[job_id].model_dump()
                current.update(kwargs)
                self._jobs[job_id] = JobStatus(**current)

    async def increment_detections(self, job_id: str, count: int = 1):
        async with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].detectionsCount += count

    def get(self, job_id: str) -> JobStatus | None:
        return self._jobs.get(job_id)


job_manager = JobManager()