import Link from "next/link";

export default function LoopNotFound() {
  return (
    <div>
      <h1 className="page-title">Loop not found</h1>
      <p className="lede">That id is not in the current data set.</p>
      <p>
        <Link href="/looper">Back to loops</Link>
      </p>
    </div>
  );
}
