use components Row, Col to build a responsive grid:

<Row space>
    <Col lg="4" md="3" sm="2" xs="1" col="1">
        Content
    </Col>
    <Col lg="4" md="3" sm="2" xs="1" col="1">
        Content
    </Col>
</Row>

The number is how many elements fit per row. lg="4" means that in large screens there will be 4 elements horizontally.

For asymmetric grids, we can also use percentages:

<Row space>
    <Col sm="30-p" col="1">
        Content
    </Col>
    <Col sm="70-p" col="1">
        Content
    </Col>
</Row>

First row will occupy 30% and second 70%.