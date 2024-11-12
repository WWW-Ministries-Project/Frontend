export default function MembersCount(
  props: Readonly<{ items: { count: number; label: string }[] }>
) {
  return (
    <div className="flex gap-1 border p-3 items-center justify-between border-lightGray rounded-lg w-full divide-x-2 divide-lightGray shadow-sm">
      {props.items.map((item, index) => (
        <div
          className="flex gap-1 flex-col px-3 items-center justify-center mx-auto"
          key={item.label}
        >
          <p
            className={`text-dark900 text-4xl  ${
              index === 0 ? "font-bold " : ""
            }`}
          >
            {item.count}
          </p>
          <p
            className={`text-dark900 text-sm text-center ${
              index === 0 ? "font-bold" : ""
            }`}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
