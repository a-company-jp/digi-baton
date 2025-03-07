import { Input } from "@/components/ui/input";
import { ColumnDef, Table as ReactTable, flexRender } from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function TableSearch<T>({ table, key, placeholder }: { table: ReactTable<T>; key: string; placeholder: string }) {
  return (
    <div className="relative max-w-sm">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={(table.getColumn(key)?.getFilterValue() as string) ?? ""}
        onChange={(event) => table.getColumn(key)?.setFilterValue(event.target.value)}
        className="w-80 pl-8"
      />
    </div>
  );
}

function TableNextButton<T>({ table }: { table: ReactTable<T> }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
    >
      次へ
    </Button>
  );
}

function TablePreviousButton<T>({ table }: { table: ReactTable<T> }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
    >
      前へ
    </Button>
  );
}

function TablePagination<T>({ table }: { table: ReactTable<T> }) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <TablePreviousButton table={table} />
      <TableNextButton table={table} />
    </div>
  );
}

function TableUI<T>({ table, columns, noFoundMessage }: { table: ReactTable<T>; columns: ColumnDef<T>[]; noFoundMessage: string }) {
  return (
    <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {noFoundMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  )
}

export { TableSearch, TablePagination, TableUI };
