import { LayoutGrid, Utensils } from "lucide-react";

interface Props {
  subCategories: string[];
  active: string;
  onSelect: (sub: string) => void;
}

export default function SubCategoryNav({ subCategories, active, onSelect }: Props) {
  if (!subCategories || subCategories.length === 0) return null;

  return (
    <div className="mb-4">
      <div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          onClick={() => onSelect("todos")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            active === "todos"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-foreground border-border active:bg-muted"
          }`}
        >
          <LayoutGrid size={13} />
          Todos
        </button>
        {subCategories.map((sub) => (
          <button
            key={sub}
            onClick={() => onSelect(sub)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              active === sub
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-foreground border-border active:bg-muted"
            }`}
          >
            <Utensils size={13} />
            {sub}
          </button>
        ))}
      </div>
    </div>
  );
}
