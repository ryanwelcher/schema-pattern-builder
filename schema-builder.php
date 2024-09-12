<?php
/**
 * Plugin Name:       Schema Builder
 * Description:       Example block scaffolded with Create Block tool.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       schema-builder
 *
 * @package CreateBlock
 */

namespace SchemaBuilder;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Stuff to do
 *
 * 1. Pull in the schema from https://schema.org/version/latest/schemaorg-current-https.jsonld ✅
 * 2. Cache it somewhere  ✅
 * 3. Get all of the @type definitions and create group block variations from them using the value for the schemaType attribute
 * 4. Create a pattern for each type using register_block_pattern - make them content only editing?
 * 5. Add hide toggles to each block with editor.BlockEdit hook and add attribute to block with blocks.registerBlockType
 * 6. Generate the schema dynamically based on block content.
 * 7. Save meta somewhere
 * 8. ??
 * 9. Profit!
 * /

/**
 * Our class to deal with stuff.
 */
class PatternBuilder {

	/**
	 * Holds the raw schema
	 *
	 * @var array $raw_schema
	 */
	private $raw_schema = [];

	/**
	 * Holds the patterns
	 *
	 * @var array $patterns
	 */
	private $patterns = [];

	const DATA_TYPES = [
		'schema:Text',
		'schema:Time',
		'scheme:DateTime',
		'schema:Boolean',
		'schema:Number',
		'schema:Date',
	];

	const THING_PROPS = [
		'schema:disambiguatingDescription',
		'schema:url',
		'schema:subjectOf',
		'schema:mainEntityOfPage',
		'schema:alternateName',
		'schema:additionalType',
		'schema:description',
		'schema:image',
		'schema:identifier',
		'schema:potentialAction',
		'schema:sameAs',
		'schema:name',
	];


	/**
	 * Hooks into init to start the show.
	 */
	public function hooks() {
		add_action( 'init', array( $this, 'retrieve_and_store_schema' ) );

		// Register a CPT and a Taxonomy
		add_action( 'init', array( $this, 'register_data_types' ), 2, 20 );

		// Create an admin screen
		add_action( 'admin_menu', array( $this, 'register_schema_admin' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'schema_admin_enqueue_assets' ) );

		// Filter the REST query to allow using post meta
		add_filter( 'rest_schema_query', array( $this, 'query_schema_by_status' ), 10, 2 );

	}

	/**
	 * Enable meta_query for the schema REST endpoint
	 */
	public function query_schema_by_status( $args, $request ) {
		if ( isset( $request['enabled'] ) && strlen( $request['enabled'] ) ) {
			$status = filter_var( $request['enabled'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );

			$args['meta_query'] = array(
				array(
					'key'   => 'enabled',
					'value' => $status,
				),
			);

			if ( true === $status ) {
				$args['meta_query']['relation'] = 'OR';
				$args['meta_query'][]           = array(
					'key'     => 'enabled',
					'value'   => '',
					'compare' => 'NOT EXISTS',
				);
			}
		}

		return $args;
	}
	/**
	 * Creates a new page and set the HTML for it.
	 */
	public function register_schema_admin() {
		add_menu_page(
			__( 'Schema Pattern Builder', 'schema-builder' ),
			__( 'Schema Pattern Builder', 'schema-builder' ),
			'manage_options',
			'schema-pattern-builder',
			function () {
				echo '<div id="schema-pattern-builder"></div>';
			}
		);
	}

	/**
	 * Enqueues the assets for our custom page.
	 *
	 * @param string $hook_suffix The name of the screen.
	 */
	public function schema_admin_enqueue_assets( $hook_suffix ) {
		// Load only on ?toplevel_page_schema-pattern-builder
		if ( 'toplevel_page_schema-pattern-builder' !== $hook_suffix ) {
			return;
		}

		$dir = plugin_dir_path( __FILE__ );
		$url = plugin_dir_url( __FILE__ );

		$asset_file = $dir . 'build/admin.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		wp_enqueue_script(
			'schema-admin-script',
			$url . 'build/admin.js',
			$asset['dependencies'],
			$asset['version'],
			array(
				'in_footer' => true,
			)
		);

		// Combined CSS.
		wp_enqueue_style(
			'schema-admin-styles',
			$url . 'build/style-admin.css',
			array( 'wp-components' ),
			$asset['version'],
		);
	}


	public function register_data_types() {
		$cpt_args = array(
			'public'       => true, // Just for testing.
			'show_in_rest' => true,
			'label'        => __( 'Schema', 'schema-builder' ),
			'supports'     => array( 'title', 'editor', 'custom-fields' ),
		);

		$tax_args = array(
			'public'       => true, // Just for testing.
			'show_in_rest' => true,
			'label'        => __( 'Property', 'schema-builder' ),
		);

		register_post_type( 'schema', $cpt_args );
		register_taxonomy( 'property', 'schema', $tax_args );

		register_post_meta(
			'schema',
			'enabled',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'boolean',
				'default'      => true,
			)
		);

		register_post_meta(
			'schema',
			'mapping',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);

		register_term_meta(
			'property',
			'allowed_types',
			array(
				'type'         => 'string',
				'single'       => true,
				'show_in_rest' => true,
			)
		);
	}

	/**
	 * Process the external schema and store it
	 */
	public function retrieve_and_store_schema() {

		// Get the cached schema or retrieve it, cache it and then use it.
		if ( false === ( $raw_schema = get_transient( 'schema-builder-schema' ) ) ) {
			$response = wp_remote_get(
				'https://schema.org/version/latest/schemaorg-current-https.jsonld',
				array(
					'headers' => array(
						'Accept' => 'application/json',
					),
				),
			);
			if ( ( ! is_wp_error( $response ) ) && ( 200 === wp_remote_retrieve_response_code( $response ) ) ) {
				$response_body = json_decode( $response['body'] );
				if ( json_last_error() === JSON_ERROR_NONE ) {
					$raw_schema = $response_body->{'@graph'};
					set_transient( 'schema-builder-schema', $raw_schema, DAY_IN_SECONDS * 365 );
				}
			}
		}

		// Set the class member to hold the raw data.
		$this->raw_schema = $raw_schema;

		// Generate the list of schemas and relationships
		$this->patterns = $this->process_pattern_list( $this->raw_schema );

		// Insert the posts and terms for the schemas
		$this->insert_schemas( $this->patterns );
	}

	/**
	 * Generate the pattern list array
	 *
	 * @param array $schema The array of schema.
	 */
	public function process_pattern_list( array $schema = [] ) {
		$patterns = [];

		// Process the schema part of the show.
		if ( $schema ) {
			foreach ( $schema as $node ) {
				$id = $node->{'@id'}; // 'schema:citation'
				// Put the node in the array index by name
				if ( ! array_key_exists( $node->{'@id'}, $patterns ) ) {
					$patterns[ $node->{'@id'} ] = [
						'node'          => $node,
						'properties'    => array_merge( self::THING_PROPS, [] ),
						'allowed_types' => [],
					];
				} else {
					$patterns[ $node->{'@id'} ]['node'] = $node;
				}
				// These are types that it can be part of.
				$domain_includes = $node->{'schema:domainIncludes'} ?? false; // This can be an array or a single class.
				// These are the types it can be represented with.
				$range_includes = $node->{'schema:rangeIncludes'} ?? false;

				if ( false !== $domain_includes ) {
					// We're processing a property
					if ( is_array( $domain_includes ) ) {
						foreach ( $domain_includes as $class ) {
							// Does the class exist in the list of patterns. If not, add it.
							if ( ! array_key_exists( $class->{'@id'}, $patterns ) ) {
								$patterns[ $class->{'@id'} ] = [
									'properties'    => array_merge( self::THING_PROPS, [] ),
									'allowed_types' => [],
								];
							}
							array_push( $patterns[ $class->{'@id'} ]['properties'], $id );
						}
					} else {
						// Does the class exist in the list of patterns. If not, add it.
						if ( ! array_key_exists( $domain_includes->{'@id'}, $patterns ) ) {
							$patterns[ $domain_includes->{'@id'} ] = [
								'properties'    => array_merge( self::THING_PROPS, [] ),
								'allowed_types' => [],
								'node'          => null,
							];
						}
						array_push( $patterns[ $domain_includes->{'@id'} ]['properties'], $id );
					}
				}
				// Defines the list of items that can be used to represent the ID.
				if ( false !== $range_includes ) {
					if ( is_array( $range_includes ) ) {
						foreach ( $range_includes as $range ) {
							if ( ! array_key_exists( $id, $patterns ) ) {
								$patterns[ $id ] = [
									'properties'    => array_merge( self::THING_PROPS, [] ),
									'allowed_types' => [],
									'node'          => null,
								];
							}
							array_push( $patterns[ $id ]['allowed_types'], $range->{'@id'} );
						}
					} else {
						if ( ! array_key_exists( $id, $patterns ) ) {
							$patterns[ $id ] = [
								'properties'    => array_merge( self::THING_PROPS, [] ),
								'allowed_types' => [],
							];
						}
						array_push( $patterns[ $id ]['allowed_types'], $range_includes->{'@id'} );
					}
				}
			}
		}

		return $patterns;
	}

	/**
	 * Create block patterns from a pattern list
	 *
	 * @param array $pattern_list The list of schema.org entries to generate patterns from.
	 */
	public function insert_schemas( array $pattern_list ) {
		// Can we insert?
		$has_run = get_option( 'inserted_schemas', false );
		if ( $has_run ) {
			return;
		}

		foreach ( $pattern_list as $id => $pattern ) {

			// rdsf:Class types are going to be patterns
			$type = $pattern['node']->{'@type'};

			// Skip simple data types
			if ( is_array( $type ) && in_array( 'schema:DataType', $type, true ) ) {
				continue;
			} else {
				// Skip anything that is not `rdfs:Class`.
				if ( 'rdfs:Class' !== $type ) {
					continue;
				}
			}

			// Add the terms.
			$terms_to_insert = array();
			foreach ( $pattern['properties'] as $property ) {
				// Check for the term or create it
				$term = get_term_by( 'name', $property, 'property', ARRAY_A );
				if ( ! $term ) {
					$term = wp_insert_term( $property, 'property' );
					// Add the types that property can be represented as.
					$property_def = $pattern_list[ $property ] ?? false;
					if ( $property_def ) {
						add_term_meta(
							$term['term_id'],
							'allowed_types',
							implode( ',', $property_def['allowed_types'] )
						);
					}
				}
				if ( ! is_wp_error( $term ) ) {
					$terms_to_insert[] = $term['term_id'];
				}
			}

			// Title of the post
			$title = str_replace( 'schema:', '', $id );

			// Get does the post already exist.
			if ( ! function_exists( 'post_exists' ) ) {
				require_once ABSPATH . 'wp-admin/includes/post.php';
			}

			$post_exists = \post_exists( $title, '', '', 'schema' );

			if ( 0 === $post_exists ) {
				// Insert the post
				wp_insert_post(
					array(
						'post_title'  => $title,
						'post_type'   => 'schema',
						'post_status' => 'publish',
						'tax_input'   => array(
							'property' => $terms_to_insert,
						),
					)
				);
			}

			// Create a var to store out eventual pattern markup
			// $html = '';

			// // Pattern details
			// $pattern_name = str_replace( ':', '-', strtolower( $id ) );
			// $desc         = $pattern['node']->{'rdfs:comment'};
			// $type_name    = str_replace( 'schema:', '', $id );
			// $title        = trim( preg_replace( '/(?<=[a-z])[A-Z]|[A-Z](?=[a-z])/', ' $0', $type_name ) );

			// // Loop the properties to create the pattern
			// foreach ( $pattern['properties'] as $property ) {
			// 	// Get the property definition from the raw schema
			// 	$property_def = $pattern_list[ $property ] ?? false;
			// 	if ( $property_def ) {
			// 		// Get the simplest data type available.
			// 		$type = $this->get_simplest_data_type( $property_def['allowed_types'] );
			// 		if ( $type ) {
			// 			// For now let's do this.
			// 			$html .= "\n<!-- wp:paragraph {\"schemaProp\":\"$property\"} -->\n<p>$property : $type</p>\n<!-- /wp:paragraph -->";
			// 		} else {
			// 			// We need to handle non-simple data types and classes.
			// 			$html .= "<!-- wp:heading {\"className\":\"is-style-default\",\"schemaProp\":\"$property\"} -->\n<h2 class=\"wp-block-heading is-style-default\">PLACEHOLDER::$property</h2>\n<!-- /wp:heading -->";
			// 		}

			// 	}
			// }

		}
		update_option( 'inserted_schemas', true );
	}

	/**
	 * Retrieve the simplest data type from a list.
	 *
	 * @param array $types_to_check The list to check.
	 *
	 * @return mixed The type as a string or a boolean false if not found.
	 */
	private function get_simplest_data_type( array $types_to_check ) {
		$rtn = false;
		if ( is_array( $types_to_check ) ) {
			$data = array_intersect( $types_to_check, self::DATA_TYPES );
			if ( ! empty( $data ) ) {
				$rtn = array_values( $data )[0];
			}
		}
		return $rtn;
	}

}

$schema = new PatternBuilder();
$schema->hooks();
