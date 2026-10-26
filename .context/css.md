Check the file /lib/src/css/lib.css

Do never use Tailwind or any other css library.

To make horizontal flex rows with align items center use "flex-row":

<div class="flex-row gap10">
    <span>element 1</span>
    <span>element 2</span>
</div>

If one element must fill the available space, use "flex-grow"

<div class="flex-row gap10">
    <span class="flex-grow">element 1</span>
    <span>element 2</span>
</div>